import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { mapToTwoAxis } from '@sdlc/shared-types';
import type { SixAxisProfile } from '@sdlc/shared-types';

/**
 * PBT: 2軸マッピング（BR-07-10）
 * PBT-03: Invariant — 6軸 [0,1] → 2軸 [0,1] 範囲保証
 */

const sixAxisProfileArb = fc.record({
  f1: fc.double({ min: 0, max: 1, noNaN: true }),
  f2: fc.double({ min: 0, max: 1, noNaN: true }),
  f3: fc.double({ min: 0, max: 1, noNaN: true }),
  f4: fc.double({ min: 0, max: 1, noNaN: true }),
  f5: fc.double({ min: 0, max: 1, noNaN: true }),
  f6: fc.double({ min: 0, max: 1, noNaN: true }),
}) as fc.Arbitrary<SixAxisProfile>;

describe('PBT: 2軸マッピング', () => {
  it('6軸 [0,1] 入力に対して sweetDry は常に [0,1] 範囲内', () => {
    fc.assert(
      fc.property(sixAxisProfileArb, (profile) => {
        const result = mapToTwoAxis(profile);
        expect(result.sweetDry).toBeGreaterThanOrEqual(0);
        expect(result.sweetDry).toBeLessThanOrEqual(1);
      }),
    );
  });

  it('6軸 [0,1] 入力に対して lightRich は常に [0,1] 範囲内', () => {
    fc.assert(
      fc.property(sixAxisProfileArb, (profile) => {
        const result = mapToTwoAxis(profile);
        expect(result.lightRich).toBeGreaterThanOrEqual(0);
        expect(result.lightRich).toBeLessThanOrEqual(1);
      }),
    );
  });

  it('全軸 0.5 の場合、2軸とも 0.5', () => {
    const neutral: SixAxisProfile = { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 };
    const result = mapToTwoAxis(neutral);
    expect(result.sweetDry).toBeCloseTo(0.5, 5);
    expect(result.lightRich).toBeCloseTo(0.5, 5);
  });
});
