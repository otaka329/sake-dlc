import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { z } from 'zod';
import { recommendationSchema } from '@sdlc/shared-types';

/**
 * PBT: recommendations 件数
 * Invariant: 3〜5件（BR-08-01、Tool Use スキーマ minItems:3, maxItems:5）
 */

const recommendationsArraySchema = z.array(recommendationSchema).min(3).max(5);

describe('PBT: recommendations 件数', () => {
  const validRec = {
    brandId: 1,
    brandName: 'テスト',
    temperature: { type: 'jouon' as const, celsius: 20, label: '常温', labelEn: 'room' },
    amount: 90,
    vessel: '猪口',
    reason: '理由',
    flavorScores: null,
    matchScore: 0.8,
  };

  it('3〜5件は常にバリデーション通過', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }),
        (count) => {
          const recs = Array.from({ length: count }, () => validRec);
          const result = recommendationsArraySchema.safeParse(recs);
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('2件以下は常にバリデーション失敗', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        (count) => {
          const recs = Array.from({ length: count }, () => validRec);
          const result = recommendationsArraySchema.safeParse(recs);
          expect(result.success).toBe(false);
        },
      ),
    );
  });

  it('6件以上は常にバリデーション失敗', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 6, max: 10 }),
        (count) => {
          const recs = Array.from({ length: count }, () => validRec);
          const result = recommendationsArraySchema.safeParse(recs);
          expect(result.success).toBe(false);
        },
      ),
    );
  });
});
