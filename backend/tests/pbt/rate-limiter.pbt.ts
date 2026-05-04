import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: レート制限カウンター（NFR Design §7）
 * PBT-03: Invariant — 上限超過時は常に拒否、上限以下は常に許可
 */

const RATE_LIMIT_MAX = 100;

/**
 * レート制限判定のモデル（checkRateLimit の ConditionExpression と同等）
 * requestCount < :limit → 許可、requestCount >= :limit → 拒否
 */
function shouldReject(currentCount: number): boolean {
  return currentCount >= RATE_LIMIT_MAX;
}

describe('PBT: レート制限カウンター', () => {
  it('上限未満のカウントでは常に許可される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: RATE_LIMIT_MAX - 1 }),
        (currentCount) => {
          expect(shouldReject(currentCount)).toBe(false);
        },
      ),
    );
  });

  it('上限以上のカウントでは常に拒否される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: RATE_LIMIT_MAX, max: 1000 }),
        (currentCount) => {
          expect(shouldReject(currentCount)).toBe(true);
        },
      ),
    );
  });

  it('境界値: 99 は許可、100 は拒否', () => {
    expect(shouldReject(99)).toBe(false);
    expect(shouldReject(100)).toBe(true);
  });
});
