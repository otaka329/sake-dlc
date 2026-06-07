import { describe, it, expect } from 'vitest';
import { generateCacheKey } from '../../../src/lib/ai-gateway/cache-manager';

describe('CacheManager - generateCacheKey', () => {
  const baseArgs = {
    userId: 'user-123',
    dishes: [{ name: '刺身', category: 'sashimi' as const, source: 'text' as const }],
    mood: '元気',
    tasteProfile: { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 },
    disclosureLevel: 1 as const,
    locale: 'ja',
  };

  it('同一入力 → 同一キー（決定的）', () => {
    const key1 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, baseArgs.disclosureLevel, baseArgs.locale,
    );
    const key2 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, baseArgs.disclosureLevel, baseArgs.locale,
    );
    expect(key1).toBe(key2);
  });

  it('disclosureLevel が異なると異なるキー', () => {
    const key1 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, 1, baseArgs.locale,
    );
    const key2 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, 2, baseArgs.locale,
    );
    expect(key1).not.toBe(key2);
  });

  it('locale が異なると異なるキー', () => {
    const key1 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, baseArgs.disclosureLevel, 'ja',
    );
    const key2 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, baseArgs.disclosureLevel, 'en',
    );
    expect(key1).not.toBe(key2);
  });

  it('mood の正規化: 類似表現は同一キーになる', () => {
    const key1 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, '疲れた',
      baseArgs.tasteProfile, baseArgs.disclosureLevel, baseArgs.locale,
    );
    const key2 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, 'だるい',
      baseArgs.tasteProfile, baseArgs.disclosureLevel, baseArgs.locale,
    );
    expect(key1).toBe(key2); // 両方 'tired' バケットに正規化
  });

  it('tasteProfile の量子化: 微小差は同一キーになる', () => {
    const key1 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      { f1: 0.53, f2: 0.47, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 },
      baseArgs.disclosureLevel, baseArgs.locale,
    );
    const key2 = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 },
      baseArgs.disclosureLevel, baseArgs.locale,
    );
    expect(key1).toBe(key2); // 0.1刻み量子化で同一
  });

  it('キーは16文字の16進数', () => {
    const key = generateCacheKey(
      baseArgs.userId, baseArgs.dishes, baseArgs.mood,
      baseArgs.tasteProfile, baseArgs.disclosureLevel, baseArgs.locale,
    );
    expect(key).toMatch(/^[0-9a-f]{16}$/);
  });
});
