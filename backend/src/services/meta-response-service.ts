import type { MetaResponse } from '@sdlc/shared-types';
import { z } from 'zod';
import { invoke } from '../lib/ai-gateway';
import {
  META_RESPONSE_TOOL_NAME,
  META_RESPONSE_TOOL_DESCRIPTION,
  META_RESPONSE_TOOL_SCHEMA,
} from '../lib/ai-gateway/schemas/meta-response-tool';

const META_RESPONSE_TIMEOUT_MS = 5_000;

// Tool Use レスポンスの Zod スキーマ
const metaToolResponseSchema = z.object({
  message: z.string(),
  suggestedAction: z.enum(['pause', 'hydrate', 'reflect']),
});

/**
 * 判断委任パターン検出用正規表現
 * BR-12-01: 「飲むべき？」「今日いける？」「飲んでいい？」「大丈夫？」等
 */
const META_PATTERNS = [
  /飲む[べ]き/,
  /飲んでいい/,
  /飲んでも(いい|大丈夫)/,
  /今日.*いける/,
  /大丈夫.*[？?]/,
  /should\s+i\s+drink/i,
  /can\s+i\s+drink/i,
  /is\s+it\s+ok/i,
];

/**
 * MetaResponseService
 * BL-14: 判断委任パターン検出 → AI メタ応答
 */
export async function respond(
  message: string,
  locale: string,
): Promise<MetaResponse | { _dryRun: true; response: unknown } | null> {
  // 1. 判断委任パターンマッチング
  if (!isMetaQuestion(message)) {
    return null; // パターン非該当 → 通常推薦フローにリダイレクト
  }

  // 2. AI メタ応答生成
  const result = await invoke(
    {
      templateId: 'meta-response',
      input: { userMessage: message, locale },
    },
    {
      toolName: META_RESPONSE_TOOL_NAME,
      toolDescription: META_RESPONSE_TOOL_DESCRIPTION,
      toolInputSchema: META_RESPONSE_TOOL_SCHEMA as unknown as Record<string, unknown>,
      responseSchema: metaToolResponseSchema,
      timeoutMs: META_RESPONSE_TIMEOUT_MS,
    },
  );

  if (result.isDryRun) {
    return { _dryRun: true, response: result.response };
  }

  // BR-12-03: forceDeploy は常に false
  return {
    message: result.data!.message,
    suggestedAction: result.data!.suggestedAction,
    forceDeploy: false,
  };
}

/**
 * 判断委任パターン検出
 */
export function isMetaQuestion(message: string): boolean {
  return META_PATTERNS.some((pattern) => pattern.test(message));
}
