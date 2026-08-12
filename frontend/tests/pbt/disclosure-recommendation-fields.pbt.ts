import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: disclosureLevel → 表示フィールドの整合性
 * Invariant: Layer 1 ではフレーバー詳細非表示、Layer 2+ で表示
 */

type DisclosureLevel = 1 | 2 | 3;

interface DisplayFields {
  showBrandName: boolean;
  showTemperature: boolean;
  showReason: boolean;
  showFlavorScores: boolean; // Layer 2+ のみ
}

function getDisplayFields(level: DisclosureLevel): DisplayFields {
  return {
    showBrandName: true, // 常に表示
    showTemperature: true, // 常に表示
    showReason: true, // 常に表示
    showFlavorScores: level >= 2, // Layer 2+ のみ
  };
}

describe('PBT: disclosureLevel → 表示フィールド', () => {
  it('Layer 1 では showFlavorScores が常に false', () => {
    const fields = getDisplayFields(1);
    expect(fields.showFlavorScores).toBe(false);
    expect(fields.showBrandName).toBe(true);
  });

  it('Layer 2+ では showFlavorScores が常に true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(2 as DisclosureLevel, 3 as DisclosureLevel),
        (level) => {
          const fields = getDisplayFields(level);
          expect(fields.showFlavorScores).toBe(true);
        },
      ),
    );
  });

  it('全 Layer で基本フィールド（brandName, temperature, reason）は常に true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1 as DisclosureLevel, 2 as DisclosureLevel, 3 as DisclosureLevel),
        (level) => {
          const fields = getDisplayFields(level);
          expect(fields.showBrandName).toBe(true);
          expect(fields.showTemperature).toBe(true);
          expect(fields.showReason).toBe(true);
        },
      ),
    );
  });
});
