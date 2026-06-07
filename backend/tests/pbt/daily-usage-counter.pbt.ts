import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: 推薦回数カウンター
 * Invariant: 0〜3 の範囲、3超過で拒否
 */
const DAILY_LIMIT = 3;

function shouldReject(currentCount: number): boolean {
  return currentCount >= DAILY_LIMIT;
}

describe('PBT: 推薦回数カウンター', () => {
  it('上限未満のカウントでは常に許可される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: DAILY_LIMIT - 1 }),
        (count) => {
          expect(shouldReject(count)).toBe(false);
        },
      ),
    );
  });

  it('上限以上のカウントでは常に拒否される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: DAILY_LIMIT, max: 100 }),
        (count) => {
          expect(shouldReject(count)).toBe(true);
        },
      ),
    );
  });

  it('境界値: 2 は許可、3 は拒否', () => {
    expect(shouldReject(2)).toBe(false);
    expect(shouldReject(3)).toBe(true);
  });
});
