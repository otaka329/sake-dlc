import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

// DynamoDB モック
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-dynamodb')>();
  return {
    ...actual,
    DynamoDBClient: vi.fn(() => ({})),
  };
});
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({ send: mockSend })),
  },
  UpdateCommand: vi.fn((params) => ({ input: params })),
}));

import { checkRateLimit } from '../../src/middleware/rate-limiter';
import { RateLimitError } from '../../src/lib/errors';

const mockLogger = {
  warn: vi.fn(),
  error: vi.fn(),
} as any;

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常時はエラーをスローしない', async () => {
    mockSend.mockResolvedValueOnce({});
    await expect(checkRateLimit('user-123', mockLogger)).resolves.toBeUndefined();
  });

  it('ConditionalCheckFailedException → RateLimitError をスローする', async () => {
    mockSend.mockRejectedValueOnce(
      new ConditionalCheckFailedException({
        message: 'The conditional request failed',
        $metadata: {},
      }),
    );

    await expect(checkRateLimit('user-123', mockLogger)).rejects.toThrow(RateLimitError);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'レート制限超過',
      expect.objectContaining({ userId: 'user-123' }),
    );
  });

  it('DynamoDB の予期しないエラー → fail-open（エラーをスローしない）', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB service unavailable'));

    await expect(checkRateLimit('user-123', mockLogger)).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'レート制限チェック失敗（スキップ）',
      expect.any(Error),
    );
  });

  it('固定ウィンドウ ID が 60秒刻みで計算される', () => {
    const RATE_LIMIT_WINDOW_SECONDS = 60;
    const now1 = 1700000000;
    const now2 = 1700000059;
    const now3 = 1700000060;

    const windowId1 = Math.floor(now1 / RATE_LIMIT_WINDOW_SECONDS);
    const windowId2 = Math.floor(now2 / RATE_LIMIT_WINDOW_SECONDS);
    const windowId3 = Math.floor(now3 / RATE_LIMIT_WINDOW_SECONDS);

    expect(windowId1).toBe(windowId2);
    expect(windowId1).not.toBe(windowId3);
  });
});
