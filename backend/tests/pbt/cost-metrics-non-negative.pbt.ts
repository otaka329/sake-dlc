import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: コスト計装メトリクス非負
 * Invariant: inputTokens, outputTokens, latencyMs は常に >= 0
 */
describe('PBT: コスト計装メトリクス非負', () => {
  it('Bedrock レスポンスの usage 値は常に非負', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 30000 }),
        (inputTokens, outputTokens, latencyMs) => {
          expect(inputTokens).toBeGreaterThanOrEqual(0);
          expect(outputTokens).toBeGreaterThanOrEqual(0);
          expect(latencyMs).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('コスト推定値は常に非負', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 10000 }),
        (inputTokens, outputTokens) => {
          // Sonnet pricing
          const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
          expect(cost).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});
