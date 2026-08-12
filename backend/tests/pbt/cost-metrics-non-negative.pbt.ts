import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

// Powertools モック
vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({ addMetric: vi.fn(), addDimension: vi.fn(), publishStoredMetrics: vi.fn() })),
  MetricUnit: { Count: 'Count', Milliseconds: 'Milliseconds', NoUnit: 'NoUnit' },
}));
vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn(() => ({})) }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: vi.fn() })) },
  UpdateCommand: vi.fn(),
}));

import { estimateCost } from '../../src/lib/ai-gateway/cost-controller';

/**
 * PBT: コスト計装メトリクス非負（本番コード estimateCost を呼び出し）
 * Invariant: 非負入力に対して出力は常に非負
 */
describe('PBT: estimateCost（本番コード）', () => {
  it('Sonnet: 非負入力 → 非負出力', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (inputTokens, outputTokens) => {
          const cost = estimateCost('anthropic.claude-3-5-sonnet-20241022-v2:0', inputTokens, outputTokens);
          expect(cost).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('Haiku: 非負入力 → 非負出力', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (inputTokens, outputTokens) => {
          const cost = estimateCost('anthropic.claude-3-haiku-20240307-v1:0', inputTokens, outputTokens);
          expect(cost).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('未知モデル → 常に 0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('anthropic')),
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (modelId, inputTokens, outputTokens) => {
          const cost = estimateCost(modelId, inputTokens, outputTokens);
          expect(cost).toBe(0);
        },
      ),
    );
  });
});
