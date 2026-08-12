import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

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

// Powertools モック
vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({
    addMetric: vi.fn(),
    addDimension: vi.fn(),
    publishStoredMetrics: vi.fn(),
  })),
  MetricUnit: { Count: 'Count', Milliseconds: 'Milliseconds', NoUnit: 'NoUnit' },
}));

import { checkDailyUsage, isDryRun, estimateCost } from '../../../src/lib/ai-gateway/cost-controller';
import { RateLimitError } from '../../../src/lib/errors';

describe('CostController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AI_GATEWAY_DRY_RUN;
  });

  describe('checkDailyUsage', () => {
    it('正常時はエラーをスローしない', async () => {
      mockSend.mockResolvedValueOnce({});
      await expect(checkDailyUsage('user-123')).resolves.toBeUndefined();
    });

    it('ConditionalCheckFailedException → RateLimitError', async () => {
      mockSend.mockRejectedValueOnce(
        new ConditionalCheckFailedException({ message: 'failed', $metadata: {} }),
      );
      await expect(checkDailyUsage('user-123')).rejects.toThrow(RateLimitError);
    });

    it('DynamoDB エラー → fail-open（エラーなし）', async () => {
      mockSend.mockRejectedValueOnce(new Error('DDB error'));
      await expect(checkDailyUsage('user-123')).resolves.toBeUndefined();
    });

    it('ドライラン時はスキップ（F7）', async () => {
      process.env.AI_GATEWAY_DRY_RUN = 'true';
      await expect(checkDailyUsage('user-123')).resolves.toBeUndefined();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('isDryRun', () => {
    it('AI_GATEWAY_DRY_RUN=true → true', () => {
      process.env.AI_GATEWAY_DRY_RUN = 'true';
      expect(isDryRun()).toBe(true);
    });

    it('未設定 → false', () => {
      expect(isDryRun()).toBe(false);
    });
  });

  describe('estimateCost', () => {
    it('Sonnet のコスト計算が正しい', () => {
      const cost = estimateCost('anthropic.claude-3-5-sonnet-20241022-v2:0', 2000, 1500);
      // (2000 * 3 + 1500 * 15) / 1_000_000 = 0.006 + 0.0225 = 0.0285
      expect(cost).toBeCloseTo(0.0285, 4);
    });

    it('Haiku のコスト計算が正しい', () => {
      const cost = estimateCost('anthropic.claude-3-haiku-20240307-v1:0', 800, 400);
      // (800 * 0.25 + 400 * 1.25) / 1_000_000 = 0.0002 + 0.0005 = 0.0007
      expect(cost).toBeCloseTo(0.0007, 5);
    });

    it('未知のモデルは 0 を返す', () => {
      expect(estimateCost('unknown-model', 1000, 1000)).toBe(0);
    });
  });
});
