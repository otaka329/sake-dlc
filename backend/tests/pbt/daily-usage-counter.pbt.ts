import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

/**
 * PBT: 推薦回数カウンター（本番コード checkDailyUsage を呼び出し）
 * Invariant: ConditionalCheckFailed → 常に RateLimitError
 */

// DynamoDB モック
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-dynamodb')>();
  return { ...actual, DynamoDBClient: vi.fn(() => ({})) };
});
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  UpdateCommand: vi.fn((params) => ({ input: params })),
}));
vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));
vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({ addMetric: vi.fn(), addDimension: vi.fn(), publishStoredMetrics: vi.fn() })),
  MetricUnit: { Count: 'Count', Milliseconds: 'Milliseconds', NoUnit: 'NoUnit' },
}));

import { checkDailyUsage } from '../../src/lib/ai-gateway/cost-controller';
import { RateLimitError } from '../../src/lib/errors';

describe('PBT: checkDailyUsage（本番コード）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AI_GATEWAY_DRY_RUN;
  });

  it('DynamoDB 成功時は常にエラーなし', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 36 }),
        async (userId) => {
          mockSend.mockResolvedValueOnce({});
          await expect(checkDailyUsage(userId)).resolves.toBeUndefined();
        },
      ),
    );
  });

  it('ConditionalCheckFailedException は常に RateLimitError', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 36 }),
        async (userId) => {
          mockSend.mockRejectedValueOnce(
            new ConditionalCheckFailedException({ message: 'failed', $metadata: {} }),
          );
          await expect(checkDailyUsage(userId)).rejects.toThrow(RateLimitError);
        },
      ),
    );
  });
});
