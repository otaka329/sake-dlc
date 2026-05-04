import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: 開示レイヤー初期設定（BR-07-01〜04）
 * PBT-03: Invariant — sakeExperience → disclosureLevel マッピング
 */

type SakeExperience = 'beginner' | 'intermediate' | 'advanced';

function calculateInitialDisclosure(sakeExperience?: SakeExperience) {
  switch (sakeExperience) {
    case 'intermediate':
      return { disclosureLevel: 1, unlockedCategories: ['type', 'region'] };
    case 'advanced':
      return { disclosureLevel: 3, unlockedCategories: [] as string[] };
    default:
      return { disclosureLevel: 1, unlockedCategories: [] as string[] };
  }
}

describe('PBT: 開示レイヤー初期設定', () => {
  it('beginner は常に Layer 1、カテゴリなし', () => {
    const result = calculateInitialDisclosure('beginner');
    expect(result.disclosureLevel).toBe(1);
    expect(result.unlockedCategories).toEqual([]);
  });

  it('未指定は常に Layer 1、カテゴリなし', () => {
    const result = calculateInitialDisclosure(undefined);
    expect(result.disclosureLevel).toBe(1);
    expect(result.unlockedCategories).toEqual([]);
  });

  it('intermediate は常に Layer 1 + type/region 解放', () => {
    const result = calculateInitialDisclosure('intermediate');
    expect(result.disclosureLevel).toBe(1);
    expect(result.unlockedCategories).toContain('type');
    expect(result.unlockedCategories).toContain('region');
  });

  it('advanced は常に Layer 3、カテゴリなし', () => {
    const result = calculateInitialDisclosure('advanced');
    expect(result.disclosureLevel).toBe(3);
    expect(result.unlockedCategories).toEqual([]);
  });

  it('全 sakeExperience で disclosureLevel は 1〜3 の範囲内', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SakeExperience | undefined>('beginner', 'intermediate', 'advanced', undefined),
        (exp) => {
          const result = calculateInitialDisclosure(exp);
          expect(result.disclosureLevel).toBeGreaterThanOrEqual(1);
          expect(result.disclosureLevel).toBeLessThanOrEqual(3);
        },
      ),
    );
  });
});
