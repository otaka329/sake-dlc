import { describe, it, expect, vi, beforeEach } from 'vitest';

// DynamoDB モック
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  QueryCommand: vi.fn((params) => ({ input: params })),
  PutCommand: vi.fn((params) => ({ input: params })),
}));

import { checkRateLimit } from '../../src/middleware/rate-limiter';
import { RateLimitError } from '../../src/lib/errors';

const mockLogger = {
  warn: vi.fn(),
  error: vi.fn(),
} as any;

describe('checkRateLimit（スライディングウィンドウ）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('カウント < 100 の場合はエラーなし + PutItem で記録', async () => {
    // Query → count 50（上限未満）
    mockSend.mockResolvedValueOnce({ Count: 50 });
    // PutItem → 成功
    mockSend.mockResolvedValueOnce({});

    await expect(checkRateLimit('user-123', mockLogger)).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(2); // Query + PutItem
  });

  it('カウント >= 100 の場合は RateLimitError', async () => {
    // Query → count 100（上限到達）
    mockSend.mockResolvedValueOnce({ Count: 100 });

    await expect(checkRateLimit('user-123', mockLogger)).rejects.toThrow(RateLimitError);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'レート制限超過',
      expect.objectContaining({ userId: 'user-123' }),
    );
  });

  it('DynamoDB エラー → fail-open（エラーなし）', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB unavailable'));

    await expect(checkRateLimit('user-123', mockLogger)).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      'レート制限チェック失敗（スキップ）',
      expect.any(Error),
    );
  });
});
