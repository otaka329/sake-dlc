import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateCacheKey } from '../../src/lib/ai-gateway/cache-manager';

/**
 * PBT: キャッシュキー生成
 * Invariant: 同一入力→同一キー、disclosureLevel/locale差→異キー
 */
describe('PBT: キャッシュキー生成', () => {
  const baseDishes = [{ name: 'test', category: 'sashimi' as const, source: 'text' as const }];
  const baseProfile = { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 };

  it('同一入力は常に同一キーを生成する（決定的）', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (mood) => {
          const key1 = generateCacheKey('user', baseDishes, mood, baseProfile, 1, 'ja');
          const key2 = generateCacheKey('user', baseDishes, mood, baseProfile, 1, 'ja');
          expect(key1).toBe(key2);
        },
      ),
    );
  });

  it('disclosureLevel が異なると常に異なるキー', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1 as const, 2 as const, 3 as const),
        fc.constantFrom(1 as const, 2 as const, 3 as const),
        (level1, level2) => {
          fc.pre(level1 !== level2);
          const key1 = generateCacheKey('user', baseDishes, 'neutral', baseProfile, level1, 'ja');
          const key2 = generateCacheKey('user', baseDishes, 'neutral', baseProfile, level2, 'ja');
          expect(key1).not.toBe(key2);
        },
      ),
    );
  });

  it('キーは常に16文字の16進数', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (mood) => {
          const key = generateCacheKey('user', baseDishes, mood, baseProfile, 1, 'ja');
          expect(key).toMatch(/^[0-9a-f]{16}$/);
        },
      ),
    );
  });
});
