import { z } from 'zod';

/**
 * 開示レイヤーレベル（1: 感覚・感情軸、2: カテゴリ・産地軸、3: 専門軸）
 */
export const disclosureLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type DisclosureLevel = z.infer<typeof disclosureLevelSchema>;

/**
 * Layer 2 個別解放可能なカテゴリ（vessel/seasonal は Layer 3 のため対象外）
 */
export const unlockCategorySchema = z.enum(['type', 'region', 'temperature']);
export type UnlockCategory = z.infer<typeof unlockCategorySchema>;

/**
 * 日本酒経験レベル
 */
export const sakeExperienceSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type SakeExperience = z.infer<typeof sakeExperienceSchema>;

/**
 * ロケール
 */
export const localeSchema = z.enum(['ja', 'en']);
export type Locale = z.infer<typeof localeSchema>;

/**
 * 認証プロバイダー
 */
export const authProviderSchema = z.enum(['email', 'google', 'apple']);
export type AuthProvider = z.infer<typeof authProviderSchema>;

/**
 * POST /signup リクエストスキーマ
 * BR-03-01: ニックネーム 2〜20文字
 * BR-03-02: 許可文字（ひらがな、カタカナ、漢字、英数字、アンダースコア）
 * BR-03-04: sakeExperience は任意（スキップ可）
 */
export const signupRequestSchema = z.object({
  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上で入力してください')
    .max(20, 'ニックネームは20文字以内で入力してください')
    .regex(
      /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9_]+$/u,
      'ニックネームに使用できない文字が含まれています',
    ),
  locale: localeSchema,
  sakeExperience: sakeExperienceSchema.optional(),
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * PUT /profile リクエストスキーマ（部分更新）
 */
export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上で入力してください')
    .max(20, 'ニックネームは20文字以内で入力してください')
    .regex(/^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9_]+$/u)
    .optional(),
  locale: localeSchema.optional(),
  sakeExperience: sakeExperienceSchema.optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

/**
 * PUT /disclosure-level リクエストスキーマ
 * BR-07-05: unlock_category は Layer 2 カテゴリのみ（type, region, temperature）
 */
export const updateDisclosureLevelSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('unlock_category'),
    category: unlockCategorySchema,
  }),
  z.object({
    action: z.literal('unlock_all'),
  }),
]);
export type UpdateDisclosureLevelRequest = z.infer<typeof updateDisclosureLevelSchema>;

/**
 * User レスポンススキーマ
 */
export const userResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string(),
  locale: localeSchema,
  sakeExperience: sakeExperienceSchema.nullable(),
  authProvider: authProviderSchema,
  disclosureLevel: disclosureLevelSchema,
  unlockedCategories: z.array(unlockCategorySchema),
  googleCalendarLinked: z.boolean(),
  notificationEnabled: z.boolean(),
  mfaEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

/**
 * エラーレスポンススキーマ
 */
export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'AUTH_ERROR',
  'FORBIDDEN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorDetailSchema = z.object({
  field: z.string(),
  reason: z.string(),
});

export const errorResponseSchema = z.object({
  code: errorCodeSchema,
  message: z.string(),
  details: z.array(errorDetailSchema).optional(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
