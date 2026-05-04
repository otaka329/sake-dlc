import { z } from 'zod';

/**
 * POST /mfa/recovery-codes レスポンススキーマ
 * BR-02B-05: リカバリーコード10個を発行
 */
export const mfaRecoveryCodesResponseSchema = z.object({
  codes: z.array(z.string()).length(10),
});
export type MfaRecoveryCodesResponse = z.infer<typeof mfaRecoveryCodesResponseSchema>;

/**
 * POST /mfa/verify リクエストスキーマ
 * BR-02B-09: TOTPコード 6桁数字
 */
export const mfaVerifyRequestSchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/, 'TOTPコードは6桁の数字で入力してください'),
});
export type MfaVerifyRequest = z.infer<typeof mfaVerifyRequestSchema>;

/**
 * DELETE /mfa リクエストスキーマ
 * BR-02B-10: 無効化には TOTP コードまたはリカバリーコードが必要
 */
export const mfaDeleteRequestSchema = z.object({
  totpCode: z.string().regex(/^\d{6}$/).optional(),
  recoveryCode: z.string().optional(),
}).refine(
  (data) => data.totpCode || data.recoveryCode,
  { message: 'TOTPコードまたはリカバリーコードのいずれかが必要です' },
);
export type MfaDeleteRequest = z.infer<typeof mfaDeleteRequestSchema>;
