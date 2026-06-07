import { z } from 'zod';
import { deployAdviceSchema } from './deploy-advice';

/**
 * 温度推薦スキーマ
 */
export const temperatureRecommendationSchema = z.object({
  type: z.enum(['reishu', 'jouon', 'nurukan', 'atsukan']),
  celsius: z.number().int().min(0).max(100),
  label: z.string().max(50),
  labelEn: z.string().max(50),
});
export type TemperatureRecommendation = z.infer<typeof temperatureRecommendationSchema>;

/**
 * フレーバースコアスキーマ（6軸、各 0.0〜1.0）
 */
export const flavorScoresSchema = z.object({
  f1: z.number().min(0).max(1),
  f2: z.number().min(0).max(1),
  f3: z.number().min(0).max(1),
  f4: z.number().min(0).max(1),
  f5: z.number().min(0).max(1),
  f6: z.number().min(0).max(1),
});
export type FlavorScores = z.infer<typeof flavorScoresSchema>;

/**
 * 推薦結果1件スキーマ
 * flavorScores: Lambda が SakenowaCache から付与（F4: 該当 brandId なしの場合 null）
 */
export const recommendationSchema = z.object({
  brandId: z.number().int(),
  brandName: z.string().max(100),
  temperature: temperatureRecommendationSchema,
  amount: z.number().int().min(30).max(300),
  vessel: z.string().max(50),
  reason: z.string().max(500),
  flavorScores: flavorScoresSchema.nullable(),
  matchScore: z.number().min(0).max(1),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

/**
 * 推薦レスポンススキーマ
 */
export const recommendationResponseSchema = z.object({
  recommendations: z.array(recommendationSchema).min(3).max(5),
  deployAdvice: deployAdviceSchema,
  attribution: z.string(),
});
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
