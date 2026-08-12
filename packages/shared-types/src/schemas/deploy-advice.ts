import { z } from 'zod';

/**
 * ノンアル代替提案スキーマ
 */
export const alternativeProposalSchema = z.object({
  name: z.string().max(100),
  reason: z.string().max(300),
  season: z.string().max(20).optional(),
});
export type AlternativeProposal = z.infer<typeof alternativeProposalSchema>;

/**
 * Deploy 判定結果スキーマ
 */
export const deployAdviceSchema = z.object({
  decision: z.enum(['deploy', 'skip_deploy']),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(500),
  ruleBased: z.boolean(),
  alternatives: z.array(alternativeProposalSchema).max(3).optional(),
});
export type DeployAdvice = z.infer<typeof deployAdviceSchema>;
