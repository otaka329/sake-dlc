import { z } from 'zod';

/**
 * メタ応答スキーマ
 */
export const metaResponseSchema = z.object({
  message: z.string().max(1000),
  suggestedAction: z.enum(['pause', 'hydrate', 'reflect']),
  forceDeploy: z.literal(false), // 常に false（BR-12-03）
});
export type MetaResponse = z.infer<typeof metaResponseSchema>;

/**
 * POST /meta-response リクエストスキーマ
 */
export const metaResponseRequestSchema = z.object({
  message: z.string().min(1).max(500),
});
export type MetaResponseRequest = z.infer<typeof metaResponseRequestSchema>;
