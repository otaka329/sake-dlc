import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { createLogger } from '../logger';
import { createMetrics, MetricUnit } from '../metrics';
import { getDocClient, TableNames } from '../dynamodb';
import { RateLimitError } from '../errors';

const logger = createLogger('cost-controller');
const metrics = createMetrics('cost-controller', 'SDLC/AIGateway');

/**
 * AI コスト制御
 * - 推薦回数制限: 3回/日（DynamoDB アトミック）
 * - コスト計装メトリクス送出
 * - ドライランモード判定
 */

const DAILY_LIMIT = parseInt(process.env.RECOMMEND_DAILY_LIMIT || '3', 10);

/**
 * モデル単価テーブル（運用メモ: AWS価格改定時に更新。四半期ごとに確認推奨）
 */
const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  'anthropic.claude-3-5-sonnet-20241022-v2:0': { inputPerMillion: 3, outputPerMillion: 15 },
  'anthropic.claude-3-haiku-20240307-v1:0': { inputPerMillion: 0.25, outputPerMillion: 1.25 },
};

/**
 * ドライランモード判定
 */
export function isDryRun(): boolean {
  return process.env.AI_GATEWAY_DRY_RUN === 'true';
}

/**
 * 推薦回数制限チェック（アトミック UpdateItem + ConditionExpression）
 * F3: check-then-increment ではなく1回の UpdateItem で原子的に判定+増分
 * ConditionalCheckFailedException → RateLimitError (429)
 *
 * ドライランモード時はスキップ（F7: 日次枠を消費しない）
 */
export async function checkDailyUsage(userId: string): Promise<void> {
  if (isDryRun()) return; // F7: ドライランは回数消費しない

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const tomorrowEpoch = Math.floor(new Date(`${today}T00:00:00Z`).getTime() / 1000) + 86400;
  const docClient = getDocClient();

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TableNames.appData(),
        Key: { userId, dataType: `AI_USAGE#${today}` },
        UpdateExpression: 'ADD #count :inc SET #ttl = if_not_exists(#ttl, :ttlVal)',
        ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
        ExpressionAttributeNames: {
          '#count': 'count',
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':limit': DAILY_LIMIT,
          ':ttlVal': tomorrowEpoch,
        },
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      logger.warn('推薦回数制限超過', { userId, limit: DAILY_LIMIT });
      throw new RateLimitError('本日の推薦回数上限に達しました。明日またお試しください。');
    }
    // DynamoDB エラーは回数制限をスキップ（可用性優先）
    // ⚠️ 意図的 fail-open: DDB障害中はコストガードレール（SECURITY-11/F3）が無効化される。
    // バックストップ: API Gateway ステージスロットリング（500 req/sec）+ Unit 1 ユーザーレベルレート制限（100 req/min）が最低限の防御層として機能。
    logger.error('推薦回数チェック失敗（スキップ — 可用性優先 fail-open）', err as Error);
  }
}

/**
 * コスト計装メトリクス送出
 */
export function emitCostMetrics(
  modelId: string,
  templateId: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
): void {
  metrics.addDimension('ModelId', modelId);
  metrics.addDimension('TemplateId', templateId);
  metrics.addMetric('InputTokens', MetricUnit.Count, inputTokens);
  metrics.addMetric('OutputTokens', MetricUnit.Count, outputTokens);
  metrics.addMetric('InvocationCount', MetricUnit.Count, 1);
  metrics.addMetric('LatencyMs', MetricUnit.Milliseconds, latencyMs);
  metrics.publishStoredMetrics();
}

/**
 * キャッシュヒット/ミスメトリクス
 */
export function emitCacheMetric(hit: boolean): void {
  metrics.addMetric(hit ? 'CacheHitCount' : 'CacheMissCount', MetricUnit.Count, 1);
  metrics.publishStoredMetrics();
}

/**
 * 月次コスト推定（参考値）
 * TODO: Step 4 (RecommendationService) で呼び出しごとに集計し、
 * CloudWatch カスタムメトリクス SDLC/AIGateway EstimatedMonthlyCost として送出予定。
 * アラーム sdlc-ai-cost-warning（>$40）がこのメトリクスに依存。
 */
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return 0;
  return (inputTokens * pricing.inputPerMillion + outputTokens * pricing.outputPerMillion) / 1_000_000;
}
