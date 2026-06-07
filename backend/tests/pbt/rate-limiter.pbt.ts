import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: レート制限（本番コード checkRateLimit 呼び出し）
 * スライディングウィンドウ: Query で直近60秒のカウント → 100以上なら RateLimitError
 */

const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn(() => ({})) }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  QueryCommand: vi.fn((params) => ({ input: params })),
  PutCommand: vi.fn((params) => ({ input: params })),
}));

import { checkRateLimit } from '../../src/middleware/rate-limiter';
import { RateLimitError } from '../../src/lib/errors';

const mockLogger = { warn: vi.fn(), error: vi.fn() } as any;

describe('PBT: checkRateLimit（本番コード）', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('カウント 0〜99 → 常に許可', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 99 }),
        async (count) => {
          mockSend.mockResolvedValueOnce({ Count: count }); // Query
          mockSend.mockResolvedValueOnce({}); // PutItem
          await expect(checkRateLimit('user', mockLogger)).resolves.toBeUndefined();
        },
      ),
    );
  });

  it('カウント 100〜 → 常に RateLimitError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 500 }),
        async (count) => {
          mockSend.mockResolvedValueOnce({ Count: count }); // Query
          await expect(checkRateLimit('user', mockLogger)).rejects.toThrow(RateLimitError);
        },
      ),
    );
  });
});
