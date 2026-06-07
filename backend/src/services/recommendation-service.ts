import type { PlanInput, Recommendation, RecommendationResponse, DisclosureLevel } from '@sdlc/shared-types';
import type { SixAxisProfile } from '@sdlc/shared-types';
import { recommendationSchema } from '@sdlc/shared-types';
import { z } from 'zod';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  invoke,
  checkDailyUsage,
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  emitCacheMetric,
  isDryRun,
} from '../lib/ai-gateway';
import { estimateCost } from '../lib/ai-gateway/cost-controller';
import {
  RECOMMEND_TOOL_NAME,
  RECOMMEND_TOOL_DESCRIPTION,
  RECOMMEND_TOOL_SCHEMA,
} from '../lib/ai-gateway/schemas/recommend-tool';
import { getDocClient, TableNames } from '../lib/dynamodb';
import { createLogger } from '../lib/logger';
import { createMetrics, MetricUnit } from '../lib/metrics';

const logger = createLogger('recommendation-service');
const metrics = createMetrics('recommendation-service', 'SDLC/AIGateway');

// レスポンスの Zod スキーマ（Tool Use 出力バリデーション用）
const toolUseResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      brandId: z.number().int(),
      brandName: z.string(),
      matchScore: z.number().min(0).max(1),
      temperature: z.object({
        type: z.enum(['reishu', 'jouon', 'nurukan', 'atsukan']),
        celsius: z.number().int(),
        label: z.string(),
        labelEn: z.string(),
      }),
      amount: z.number().int().min(30).max(300),
      vessel: z.string(),
      reason: z.string(),
    }),
  ).min(3).max(5),
});

type ToolUseRecommendationOutput = z.infer<typeof toolUseResponseSchema>;

const SAKENOWA_ATTRIBUTION = 'データ提供: さけのわ (https://sakenowa.com)';
const RECOMMEND_TIMEOUT_MS = 10_000;
const FLAVOR_DATA_LIMIT = 30; // F9: 上位30銘柄に制限

/**
 * RecommendationService
 * BL-11: キャッシュ判定 → AI推薦 → flavorScores Lambda付与
 */
export async function recommend(
  planInput: PlanInput,
  userId: string,
  disclosureLevel: DisclosureLevel,
  locale: string,
): Promise<RecommendationResponse | { _dryRun: true; response: unknown }> {
  // 1. 推薦回数制限チェック（F7: ドライラン時スキップ）
  await checkDailyUsage(userId);

  // 2. TasteProfile 取得
  const tasteProfile = await getTasteProfile(userId);

  // 3. キャッシュ判定
  const dishes = planInput.dishes || [];
  const mood = planInput.mood || '';
  const cacheKey = generateCacheKey(userId, dishes, mood, tasteProfile, disclosureLevel, locale);

  const cached = await getCachedResponse(userId, cacheKey);
  if (cached) {
    emitCacheMetric(true);
    logger.info('キャッシュヒット', { cacheKey });
    return JSON.parse(cached) as RecommendationResponse;
  }
  emitCacheMetric(false);

  // 4. さけのわフレーバーデータ取得（スタブ: Unit 3 で本実装）
  const flavorData = await getFlavorData();

  // 5. AIGateway 呼び出し
  const result = await invoke(
    {
      templateId: 'recommend',
      input: {
        dishes: dishes.map((d) => d.name).join(', '),
        mood,
        tasteProfile: JSON.stringify(tasteProfile),
        flavorData: JSON.stringify(flavorData.slice(0, FLAVOR_DATA_LIMIT)),
        disclosureLevel: String(disclosureLevel),
        locale,
      },
      disclosureLevel,
    },
    {
      toolName: RECOMMEND_TOOL_NAME,
      toolDescription: RECOMMEND_TOOL_DESCRIPTION,
      toolInputSchema: RECOMMEND_TOOL_SCHEMA as unknown as Record<string, unknown>,
      responseSchema: toolUseResponseSchema,
      timeoutMs: RECOMMEND_TIMEOUT_MS,
      disclosureLevel,
    },
  );

  // M3: ドライラン時は data=null
  if (result.isDryRun) {
    return { _dryRun: true, response: result.response };
  }

  // 6. flavorScores を Lambda 側で SakenowaCache から付与（F4: ハルシネーション防止）
  const recommendations: Recommendation[] = result.data!.recommendations.map((rec) => {
    const flavor = flavorData.find((f) => f.brandId === rec.brandId);
    return {
      ...rec,
      flavorScores: flavor
        ? { f1: flavor.f1, f2: flavor.f2, f3: flavor.f3, f4: flavor.f4, f5: flavor.f5, f6: flavor.f6 }
        : null,
    };
  });

  // 7. レスポンス構築
  const response: RecommendationResponse = {
    recommendations,
    deployAdvice: {
      decision: 'deploy',
      confidence: 0.7,
      reason: '推薦結果が生成されました。体調に問題がなければ楽しんでください。',
      ruleBased: false,
    },
    attribution: SAKENOWA_ATTRIBUTION,
  };

  // 8. キャッシュ保存
  await setCachedResponse(userId, cacheKey, JSON.stringify(response));

  // L3: EstimatedMonthlyCost 送出
  const cost = estimateCost(result.response.modelId, result.response.inputTokens, result.response.outputTokens);
  metrics.addMetric('EstimatedMonthlyCost', MetricUnit.None, cost * 30); // 日次 → 月次概算
  metrics.publishStoredMetrics();

  return response;
}

// --- ヘルパー ---

async function getTasteProfile(userId: string): Promise<SixAxisProfile> {
  const docClient = getDocClient();
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.tasteProfiles(),
      Key: { userId },
    }),
  );

  if (!result.Item) {
    // 初期値（全軸 0.5）
    return { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 };
  }

  return {
    f1: result.Item.f1 as number,
    f2: result.Item.f2 as number,
    f3: result.Item.f3 as number,
    f4: result.Item.f4 as number,
    f5: result.Item.f5 as number,
    f6: result.Item.f6 as number,
  };
}

/**
 * さけのわフレーバーデータ取得（Unit 2 ではスタブ/SakenowaCache から読み取り）
 * Unit 3 BE-09 SakenowaSync がキャッシュ投入。Unit 2 時点ではスタブデータ前提。
 */
async function getFlavorData(): Promise<Array<{ brandId: number; f1: number; f2: number; f3: number; f4: number; f5: number; f6: number }>> {
  const docClient = getDocClient();
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TableNames.sakenowaCache(),
        Key: { dataType: 'flavor-charts' },
      }),
    );

    if (result.Item?.data) {
      return JSON.parse(result.Item.data as string);
    }
  } catch (err) {
    logger.warn('さけのわフレーバーデータ取得失敗（スタブ使用）', { error: (err as Error).message });
  }

  // スタブデータ（Unit 3 までのフォールバック）
  return [
    { brandId: 1, f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.4, f5: 0.5, f6: 0.7 },
    { brandId: 2, f1: 0.5, f2: 0.7, f3: 0.6, f4: 0.5, f5: 0.4, f6: 0.3 },
    { brandId: 3, f1: 0.4, f2: 0.5, f3: 0.5, f4: 0.6, f5: 0.6, f6: 0.5 },
  ];
}
