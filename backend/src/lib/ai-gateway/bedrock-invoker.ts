import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { createLogger } from '../logger';
import { InternalError } from '../errors';

const logger = createLogger('bedrock-invoker');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'ap-northeast-1',
});

/**
 * Bedrock InvokeModel（Tool Use）呼び出し
 * タイムアウト管理は AbortController で実施
 */

export interface BedrockToolUseRequest {
  modelId: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  toolInputSchema: Record<string, unknown>;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface BedrockToolUseResponse {
  toolUseOutput: unknown; // Tool Use の構造化出力
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export async function invokeToolUse(request: BedrockToolUseRequest): Promise<BedrockToolUseResponse> {
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), request.timeoutMs);

  try {
    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      messages: [
        { role: 'user', content: request.prompt },
      ],
      tools: [
        {
          name: request.toolName,
          description: request.toolDescription,
          input_schema: request.toolInputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: request.toolName },
    });

    const command = new InvokeModelCommand({
      modelId: request.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: new TextEncoder().encode(body),
    });

    const response = await bedrockClient.send(command, {
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Tool Use レスポンスから構造化出力を抽出
    const toolUseBlock = responseBody.content?.find(
      (block: { type: string }) => block.type === 'tool_use',
    );

    if (!toolUseBlock?.input) {
      logger.error('Tool Use 出力が見つかりません', { responseBody });
      throw new InternalError('AI レスポンスの構造が不正です');
    }

    return {
      toolUseOutput: toolUseBlock.input,
      inputTokens: responseBody.usage?.input_tokens || 0,
      outputTokens: responseBody.usage?.output_tokens || 0,
      latencyMs,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if ((err as Error).name === 'AbortError') {
      logger.error('Bedrock タイムアウト', { modelId: request.modelId, timeoutMs: request.timeoutMs });
      throw new InternalError('AI サービスがタイムアウトしました');
    }

    // Bedrock 429（スロットリング）は即エラー返却（リトライしない）
    if ((err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 429) {
      logger.error('Bedrock スロットリング', { modelId: request.modelId });
      throw new InternalError('AI サービスが一時的に利用できません');
    }

    throw err;
  }
}
