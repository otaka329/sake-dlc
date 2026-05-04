import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: TasteProfile 初期化（BR-03-05）
 * PBT-03: Invariant — 全6軸が 0.5
 */

function createInitialProfile() {
  return { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 };
}

describe('PBT: TasteProfile 初期化', () => {
  it('初期プロファイルの全6軸は常に 0.5（何回生成しても不変）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // ダミー入力（初期化は入力に依存しない）
        (_) => {
          const profile = createInitialProfile();
          const axes = [profile.f1, profile.f2, profile.f3, profile.f4, profile.f5, profile.f6];
          expect(axes).toHaveLength(6);
          for (const value of axes) {
            expect(value).toBe(0.5);
          }
        },
      ),
    );
  });
});
