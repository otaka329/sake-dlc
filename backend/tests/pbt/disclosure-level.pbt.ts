import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validDisclosureLevelArb } from './generators/user';

/**
 * PBT: 開示レイヤー更新（BR-07-09）
 * PBT-03: Invariant — disclosureLevel は単調増加（1→2→3 のみ、逆行不可）
 */

// 開示レイヤー更新ロジック（BR-07-09: 不可逆）
function updateDisclosureLevel(current: number, requested: number): number {
  return Math.max(current, requested); // 増加のみ
}

describe('PBT: 開示レイヤー単調増加', () => {
  it('更新後の disclosureLevel は常に更新前以上', () => {
    fc.assert(
      fc.property(
        validDisclosureLevelArb,
        validDisclosureLevelArb,
        (current, requested) => {
          const result = updateDisclosureLevel(current, requested);
          expect(result).toBeGreaterThanOrEqual(current);
        },
      ),
    );
  });

  it('更新後の disclosureLevel は 1〜3 の範囲内', () => {
    fc.assert(
      fc.property(
        validDisclosureLevelArb,
        validDisclosureLevelArb,
        (current, requested) => {
          const result = updateDisclosureLevel(current, requested);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(3);
        },
      ),
    );
  });

  it('同じ値で更新しても変化しない（冪等性）', () => {
    fc.assert(
      fc.property(validDisclosureLevelArb, (level) => {
        const result = updateDisclosureLevel(level, level);
        expect(result).toBe(level);
      }),
    );
  });
});
