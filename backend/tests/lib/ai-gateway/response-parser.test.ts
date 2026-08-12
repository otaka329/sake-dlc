import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseToolUseOutput, shouldRetry } from '../../../src/lib/ai-gateway/response-parser';

const testSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(1),
});

describe('ResponseParser - parseToolUseOutput', () => {
  it('有効なデータは success: true を返す', () => {
    const result = parseToolUseOutput({ name: 'test', score: 0.8 }, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('test');
      expect(result.data.score).toBe(0.8);
    }
  });

  it('無効なデータは success: false + error を返す', () => {
    const result = parseToolUseOutput({ name: 'test', score: 2.0 }, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('score');
    }
  });

  it('型不一致は success: false を返す', () => {
    const result = parseToolUseOutput({ name: 123, score: 0.5 }, testSchema);
    expect(result.success).toBe(false);
  });

  it('null は success: false を返す', () => {
    const result = parseToolUseOutput(null, testSchema);
    expect(result.success).toBe(false);
  });
});

describe('ResponseParser - shouldRetry', () => {
  it('パース失敗（文字列エラー）+ retryCount 0 → true', () => {
    expect(shouldRetry('parse error', 0)).toBe(true);
  });

  it('retryCount >= 1 → false（最大1回）', () => {
    expect(shouldRetry('parse error', 1)).toBe(false);
  });

  it('5xx エラー + retryCount 0 → true', () => {
    const err = { $metadata: { httpStatusCode: 500 } };
    expect(shouldRetry(err, 0)).toBe(true);
  });

  it('4xx エラー → false', () => {
    const err = { $metadata: { httpStatusCode: 400 } };
    expect(shouldRetry(err, 0)).toBe(false);
  });
});
