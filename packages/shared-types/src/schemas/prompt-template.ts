import { z } from 'zod';

/**
 * プロンプトテンプレートスキーマ（DynamoDB AppData テーブル、PK: SYSTEM）
 */
export const promptTemplateSchema = z.object({
  templateId: z.string().min(1).max(50),
  version: z.number().int().min(1),
  modelId: z.string().min(1),
  templateBody: z.string().min(1),
  variables: z.array(z.string()),
  maxTokens: z.number().int().min(1).max(4096),
  temperature: z.number().min(0).max(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PromptTemplate = z.infer<typeof promptTemplateSchema>;
