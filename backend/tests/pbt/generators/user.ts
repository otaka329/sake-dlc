import fc from 'fast-check';

/**
 * User ドメインジェネレーター（PBT-07 準拠）
 * ドメイン制約を反映したカスタムジェネレーター
 */

/** 有効なニックネーム（2〜20文字、許可文字のみ） */
export const validNicknameArb = fc.stringOf(
  fc.oneof(
    fc.char16bits().filter((c) => /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9_]/u.test(c)),
  ),
  { minLength: 2, maxLength: 20 },
);

/** 無効なニックネーム（1文字以下 or 21文字以上 or 不正文字） */
export const invalidNicknameArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 1 }), // 短すぎ
  fc.string({ minLength: 21, maxLength: 30 }), // 長すぎ
  fc.string({ minLength: 2, maxLength: 20 }).filter((s) => /[@#$%^&*!]/.test(s)), // 不正文字
);

/** 有効なロケール */
export const validLocaleArb = fc.constantFrom('ja' as const, 'en' as const);

/** 有効な sakeExperience */
export const validSakeExperienceArb = fc.constantFrom(
  'beginner' as const,
  'intermediate' as const,
  'advanced' as const,
);

/** 有効な disclosureLevel */
export const validDisclosureLevelArb = fc.constantFrom(1 as const, 2 as const, 3 as const);

/** 有効な UnlockCategory */
export const validUnlockCategoryArb = fc.constantFrom(
  'type' as const,
  'region' as const,
  'temperature' as const,
);
