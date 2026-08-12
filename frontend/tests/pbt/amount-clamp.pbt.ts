import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { recommendationSchema } from '@sdlc/shared-types';

/**
 * PBT: 適量クランプ（BR-11-02）
 * Invariant: amount は 30〜300ml 範囲
 */
describe('PBT: 適量クランプ', () => {
  const baseRec = {
    brandId: 1,
    brandName: 'テスト',
    temperature: { type: 'jouon' as const, celsius: 20, label: '常温', labelEn: 'room' },
    vessel: '猪口',
    reason: '理由',
    flavorScores: null,
    matchScore: 0.8,
  };

  it('30〜300 の amount は常にバリデーション通過', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 30, max: 300 }),
        (amount) => {
          const result = recommendationSchema.safeParse({ ...baseRec, amount });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('29 以下の amount は常にバリデーション失敗', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 29 }),
        (amount) => {
          const result = recommendationSchema.safeParse({ ...baseRec, amount });
          expect(result.success).toBe(false);
        },
      ),
    );
  });

  it('301 以上の amount は常にバリデーション失敗', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 301, max: 1000 }),
        (amount) => {
          const result = recommendationSchema.safeParse({ ...baseRec, amount });
          expect(result.success).toBe(false);
        },
      ),
    );
  });
});
