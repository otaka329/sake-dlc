import { z } from 'zod';
import { DISH_CATEGORIES_WITH_OTHER } from '../types/dish-category';

/**
 * 料理入力スキーマ
 */
export const dishInputSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(DISH_CATEGORIES_WITH_OTHER).optional(),
  source: z.enum(['text', 'image']),
});
export type DishInput = z.infer<typeof dishInputSchema>;

/**
 * Plan 入力スキーマ（POST /dont-deploy, POST /recommend 共通入力）
 * リクエストボディのサブセット。userId は JWT から抽出、createdAt はサーバ側付与のため含まない。
 * domain-entities.md の PlanInput エンティティとの差異に注意。
 */
export const planInputSchema = z.object({
  conditionScore: z.number().int().min(1).max(5).optional(),
  isMedicated: z.boolean().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  tomorrowScheduleImportance: z.number().int().min(1).max(5).optional(),
  tomorrowEarliestStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  tomorrowScheduleSummary: z.string().max(500).optional(),
  dishes: z.array(dishInputSchema).max(10).optional(),
  mood: z.string().max(200).optional(),
});
export type PlanInput = z.infer<typeof planInputSchema>;
