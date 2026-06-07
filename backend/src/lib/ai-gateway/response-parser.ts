import type { ZodSchema } from 'zod';
import { createLogger } from '../logger';

const logger = createLogger('response-parser');

/**
 * Tool Use 出力の Zod バリデーション + リトライ判定
 * リトライは最大1回（p99 SLA 保護）
 */

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Tool Use 出力を Zod スキーマでバリデーション
 */
export function parseToolUseOutput<T>(
  output: unknown,
  schema: ZodSchema<T>,
): ParseResult<T> {
  const result = schema.safeParse(output);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join('; ');

  logger.warn('Tool Use 出力パース失敗', { errors: errorMessage });

  return { success: false, error: errorMessage };
}

/**
 * リトライが必要かどうかを判定
 * パース失敗 + 5xx のみリトライ対象（最大1回）
 */
export function shouldRetry(error: unknown, retryCount: number): boolean {
  // 最大1回のリトライ
  if (retryCount >= 1) return false;

  // パース失敗はリトライ対象
  if (typeof error === 'string') return true;

  // 5xx エラーはリトライ対象
  const statusCode = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  if (statusCode && statusCode >= 500 && statusCode < 600) return true;

  return false;
}
