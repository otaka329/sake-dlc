import type { AIGatewayRequest, AIGatewayResponse, DisclosureLevel } from '@sdlc/shared-types';
import type { ZodSchema } from 'zod';
import { getTemplate, substituteVariables } from './template-manager';
import { invokeToolUse } from './bedrock-invoker';
import { parseToolUseOutput, shouldRetry } from './response-parser';
import { isDryRun, emitCostMetrics } from './cost-controller';
import { createLogger } from '../logger';
import { InternalError } from '../errors';

const logger = createLogger('ai-gateway');

/**
 * AIGateway ファサード（CM-01 本実装）
 * BL-15: テンプレート取得 → 変数置換 → Bedrock Tool Use → パース → 計装
 *
 * ドライランモード: AI_GATEWAY_DRY_RUN=true で Bedrock 呼び出しをスキップ
 */

interface InvokeOptions<T> {
  /** Tool Use の名前 */
  toolName: string;
  /** Tool Use の説明 */
  toolDescription: string;
  /** Tool Use の input_schema（JSON Schema） */
  toolInputSchema: Record<string, unknown>;
  /** レスポンスの Zod バリデーションスキーマ */
  responseSchema: ZodSchema<T>;
  /** タイムアウト（ms） */
  timeoutMs: number;
  /** 開示レイヤーに応じた追加指示 */
  disclosureLevel?: DisclosureLevel;
}

/**
 * AIGateway 呼び出し（Tool Use + リトライ1回）
 */
export async function invoke<T>(
  request: AIGatewayRequest,
  options: InvokeOptions<T>,
): Promise<{ data: T | null; response: AIGatewayResponse; isDryRun: boolean }> {
  // 1. テンプレート取得（DynamoDB Query、最新バージョン）
  const template = await getTemplate(request.templateId);

  // 2. 変数置換
  let prompt = substituteVariables(template.templateBody, request.input);

  // 3. disclosureLevel に応じた出力フォーマット指示を追加
  if (options.disclosureLevel) {
    prompt += getDisclosureSuffix(options.disclosureLevel);
  }

  // 4. ドライランモード（Bedrock 呼び出しスキップ。data は null — 呼び出し側で isDryRun を確認して分岐すること）
  if (isDryRun()) {
    logger.info('ドライランモード: Bedrock 呼び出しスキップ');
    return {
      data: null,
      isDryRun: true,
      response: {
        output: JSON.stringify({
          _dryRun: true,
          prompt,
          toolSchema: options.toolInputSchema,
          template: { id: template.templateId, version: template.version },
        }),
        inputTokens: 0,
        outputTokens: 0,
        modelId: template.modelId,
        latencyMs: 0,
      },
    };
  }

  // 5. Bedrock Tool Use 呼び出し（リトライ最大1回: パース失敗 or 5xx）
  let retryCount = 0;
  let lastError: string | null = null;

  while (retryCount <= 1) {
    const retryPrompt = retryCount > 0
      ? `${prompt}\n\n[重要] 前回の出力が不正でした。正確な形式で再出力してください。`
      : prompt;

    let bedrockResponse;
    try {
      bedrockResponse = await invokeToolUse({
        modelId: template.modelId,
        prompt: retryPrompt,
        toolName: options.toolName,
        toolDescription: options.toolDescription,
        toolInputSchema: options.toolInputSchema,
        maxTokens: template.maxTokens,
        temperature: template.temperature,
        timeoutMs: options.timeoutMs,
      });
    } catch (err) {
      // BR-13-03: 失敗時もトークン消費は不明だが、呼び出し自体は計装（0トークン、エラー記録）
      emitCostMetrics(template.modelId, request.templateId, 0, 0, 0);

      // 5xx はリトライ対象（NFR Design §3.3）
      if (shouldRetry(err, retryCount)) {
        retryCount++;
        logger.warn('Bedrock 5xx エラー、リトライ実行', { retryCount, error: (err as Error).message });
        continue;
      }
      // リトライ不可（タイムアウト、429、2回目の5xx）→ 即伝播
      throw err;
    }

    // BR-13-03: 全呼び出しで計装（成功・パース失敗を問わず）
    emitCostMetrics(
      template.modelId,
      request.templateId,
      bedrockResponse.inputTokens,
      bedrockResponse.outputTokens,
      bedrockResponse.latencyMs,
    );

    // 6. レスポンスパース（Zod バリデーション）
    const parseResult = parseToolUseOutput(bedrockResponse.toolUseOutput, options.responseSchema);

    if (parseResult.success) {
      return {
        data: parseResult.data,
        isDryRun: false,
        response: {
          output: JSON.stringify(parseResult.data),
          inputTokens: bedrockResponse.inputTokens,
          outputTokens: bedrockResponse.outputTokens,
          modelId: template.modelId,
          latencyMs: bedrockResponse.latencyMs,
        },
      };
    }

    // パース失敗 → リトライ判定
    lastError = parseResult.error;
    if (!shouldRetry(lastError, retryCount)) break;

    retryCount++;
    logger.warn('パース失敗、リトライ実行', { retryCount, error: lastError });
  }

  // 全リトライ失敗
  logger.error('AI レスポンスパース最終失敗', { templateId: request.templateId, lastError });
  throw new InternalError('AI レスポンスの処理に失敗しました');
}

/**
 * disclosureLevel に応じた出力フォーマット追加指示
 */
function getDisclosureSuffix(level: DisclosureLevel): string {
  switch (level) {
    case 1:
      return '\n\n[出力形式指示] 技術用語を使わず、感覚的な表現のみで回答してください。精米歩合・酵母・日本酒度は含めないでください。';
    case 2:
      return '\n\n[出力形式指示] 酒米・タイプ（純米/吟醸等）・産地を含めてください。精米歩合・酵母・日本酒度は含めないでください。';
    case 3:
      return '\n\n[出力形式指示] 精米歩合・酵母・日本酒度・酒器提案・季節酒情報も含めてください。';
    default:
      return '';
  }
}

// re-export for convenience
export { checkDailyUsage, emitCacheMetric, isDryRun } from './cost-controller';
export { generateCacheKey, getCachedResponse, setCachedResponse } from './cache-manager';
