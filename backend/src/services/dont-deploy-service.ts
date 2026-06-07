import type { PlanInput, DeployAdvice, AlternativeProposal } from '@sdlc/shared-types';
import { deployAdviceSchema, alternativeProposalSchema } from '@sdlc/shared-types';
import { z } from 'zod';
import { invoke, isDryRun } from '../lib/ai-gateway';
import {
  DONT_DEPLOY_TOOL_NAME,
  DONT_DEPLOY_TOOL_DESCRIPTION,
  DONT_DEPLOY_TOOL_SCHEMA,
} from '../lib/ai-gateway/schemas/dont-deploy-tool';
import {
  ALTERNATIVE_TOOL_NAME,
  ALTERNATIVE_TOOL_DESCRIPTION,
  ALTERNATIVE_TOOL_SCHEMA,
} from '../lib/ai-gateway/schemas/alternative-tool';
import { createLogger } from '../lib/logger';

const logger = createLogger('dont-deploy-service');

const DONT_DEPLOY_TIMEOUT_MS = 5_000;
const ALTERNATIVE_TIMEOUT_MS = 5_000;

// Tool Use レスポンスの Zod スキーマ
const dontDeployResponseSchema = z.object({
  decision: z.enum(['deploy', 'skip_deploy']),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

const alternativeResponseSchema = z.object({
  alternatives: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      season: z.string().optional(),
    }),
  ).min(1).max(3),
});

/**
 * DontDeployService
 * BL-12: ルールベース Phase 1 → AI判定 Phase 2 → 代替提案 BL-13
 */
export async function judge(
  planInput: PlanInput,
  userId: string,
  locale: string,
): Promise<DeployAdvice | { _dryRun: true; response: unknown }> {
  // Phase 1: ルールベース判定（BR-09-01〜04）
  const ruleResult = checkRules(planInput);
  if (ruleResult) {
    // ルールベースで Skip Deploy 確定 → 代替提案を生成
    const alternatives = await generateAlternatives(planInput.mood || '', locale);
    if (alternatives && '_dryRun' in alternatives) {
      return alternatives;
    }

    return {
      decision: 'skip_deploy',
      confidence: 1.0,
      reason: ruleResult.reason,
      ruleBased: true,
      alternatives: alternatives as AlternativeProposal[] | undefined,
    };
  }

  // Phase 2: AI 判定（グレーゾーン）
  const result = await invoke(
    {
      templateId: 'dont-deploy',
      input: {
        conditionScore: String(planInput.conditionScore || 3),
        sleepHours: String(planInput.sleepHours || 7),
        tomorrowSchedule: planInput.tomorrowScheduleSummary || '特になし',
        mood: planInput.mood || '',
      },
    },
    {
      toolName: DONT_DEPLOY_TOOL_NAME,
      toolDescription: DONT_DEPLOY_TOOL_DESCRIPTION,
      toolInputSchema: DONT_DEPLOY_TOOL_SCHEMA as unknown as Record<string, unknown>,
      responseSchema: dontDeployResponseSchema,
      timeoutMs: DONT_DEPLOY_TIMEOUT_MS,
    },
  );

  if (result.isDryRun) {
    return { _dryRun: true, response: result.response };
  }

  const aiDecision = result.data!;

  // Skip Deploy の場合、代替提案を生成
  let alternatives: AlternativeProposal[] | undefined;
  if (aiDecision.decision === 'skip_deploy') {
    const altResult = await generateAlternatives(planInput.mood || '', locale);
    if (altResult && !('_dryRun' in altResult)) {
      alternatives = altResult;
    }
  }

  return {
    decision: aiDecision.decision,
    confidence: aiDecision.confidence,
    reason: aiDecision.reason,
    ruleBased: false,
    alternatives,
  };
}

/**
 * Phase 1: ルールベース判定（BR-09-01〜04）
 * 即確定ケースのみ。グレーゾーンは null を返す。
 */
function checkRules(planInput: PlanInput): { reason: string } | null {
  // BR-09-01: 服薬中
  if (planInput.isMedicated) {
    return { reason: '服薬中のため、今日はお酒を控えましょう。お体をお大事に。' };
  }

  // BR-09-02: 体調不良（スコア 2以下）
  if (planInput.conditionScore !== undefined && planInput.conditionScore <= 2) {
    return { reason: '体調が優れないようですね。今日は休息を優先しましょう。' };
  }

  // BR-09-03: 睡眠不足（4時間以下）
  if (planInput.sleepHours !== undefined && planInput.sleepHours <= 4) {
    return { reason: '睡眠不足のようです。今日は早めに休んで、明日に備えましょう。' };
  }

  // BR-09-04: 翌朝の重要予定（重要度5 + 8時前開始）
  if (
    planInput.tomorrowScheduleImportance !== undefined &&
    planInput.tomorrowScheduleImportance >= 5 &&
    planInput.tomorrowEarliestStart &&
    planInput.tomorrowEarliestStart < '08:00'
  ) {
    return { reason: '明日の朝早くに重要な予定がありますね。万全の状態で臨むために、今日は控えめに。' };
  }

  return null; // グレーゾーン → AI 判定へ
}

/**
 * ノンアル代替提案生成（BL-13）
 */
async function generateAlternatives(
  mood: string,
  locale: string,
): Promise<AlternativeProposal[] | { _dryRun: true; response: unknown } | undefined> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const season = month <= 2 || month === 12 ? '冬' : month <= 5 ? '春' : month <= 8 ? '夏' : '秋';

  const result = await invoke(
    {
      templateId: 'alternative-proposal',
      input: { season, mood: mood || 'neutral', locale },
    },
    {
      toolName: ALTERNATIVE_TOOL_NAME,
      toolDescription: ALTERNATIVE_TOOL_DESCRIPTION,
      toolInputSchema: ALTERNATIVE_TOOL_SCHEMA as unknown as Record<string, unknown>,
      responseSchema: alternativeResponseSchema,
      timeoutMs: ALTERNATIVE_TIMEOUT_MS,
    },
  );

  if (result.isDryRun) {
    return { _dryRun: true, response: result.response };
  }

  return result.data!.alternatives;
}
