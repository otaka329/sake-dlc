/**
 * Don't Deploy Today 判定 Tool Use スキーマ
 * BR-09: Deploy/Skip Deploy 判定結果 + 確信度 + 理由
 */
export const DONT_DEPLOY_TOOL_NAME = 'judge_deploy';
export const DONT_DEPLOY_TOOL_DESCRIPTION = '今日飲むべきか飲まないべきかを総合判定し、理由と確信度を返してください。';

export const DONT_DEPLOY_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    decision: {
      type: 'string',
      enum: ['deploy', 'skip_deploy'],
      description: '判定結果',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: '判定確信度（0.0〜1.0）',
    },
    reason: {
      type: 'string',
      maxLength: 500,
      description: '判定理由（ユーザー向け、温かみのあるトーン）',
    },
  },
  required: ['decision', 'confidence', 'reason'],
} as const;
