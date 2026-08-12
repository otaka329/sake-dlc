import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { recommendationSchema } from '@sdlc/shared-types';

/**
 * PBT: matchScore 範囲
 * Invariant: AI出力の matchScore は常に [0, 1] 範囲（Zod + Tool Use スキーマで強制）
 */
describe('PBT: matchScore 範囲', () => {
  it('[0, 1] 範囲の matchScore は常にバリデーション通過', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        (matchScore) => {
          const rec = {
            brandId: 1,
            brandName: 'テスト銘柄',
            temperature: { type: 'jouon', celsius: 20, label: '常温で', labelEn: 'room temp' },
            amount: 90,
            vessel: '猪口',
            reason: 'テスト理由',
            flavorScores: null,
            matchScore,
          };
          const result = recommendationSchema.safeParse(rec);
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('[0, 1] 範囲外の matchScore は常にバリデーション失敗', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ min: -100, max: -0.001, noNaN: true }),
          fc.double({ min: 1.001, max: 100, noNaN: true }),
        ),
        (matchScore) => {
          const rec = {
            brandId: 1,
            brandName: 'テスト',
            temperature: { type: 'jouon', celsius: 20, label: '常温', labelEn: 'room' },
            amount: 90,
            vessel: '猪口',
            reason: '理由',
            flavorScores: null,
            matchScore,
          };
          const result = recommendationSchema.safeParse(rec);
          expect(result.success).toBe(false);
        },
      ),
    );
  });
});
