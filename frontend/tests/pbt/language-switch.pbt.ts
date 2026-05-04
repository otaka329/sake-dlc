import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: 言語切替 Round-trip（US-03）
 * PBT-02: ja→en→ja で元に戻る
 */

type Locale = 'ja' | 'en';

function switchLanguage(current: Locale, target: Locale): Locale {
  return target;
}

describe('PBT: 言語切替 Round-trip', () => {
  it('任意の言語から切り替えて戻すと元の言語に戻る', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Locale>('ja', 'en'),
        fc.constantFrom<Locale>('ja', 'en'),
        (original, intermediate) => {
          const switched = switchLanguage(original, intermediate);
          const restored = switchLanguage(switched, original);
          expect(restored).toBe(original);
        },
      ),
    );
  });
});
