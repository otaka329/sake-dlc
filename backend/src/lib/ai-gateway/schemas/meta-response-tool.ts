/**
 * メタ応答 Tool Use スキーマ
 * BR-12: 思慮深い応答 + 提案アクション + 非強制
 */
export const META_RESPONSE_TOOL_NAME = 'meta_response';
export const META_RESPONSE_TOOL_DESCRIPTION = '判断委任的な質問に対して、思慮深い応答と提案アクションを返してください。強制的にSkip Deployにしないでください。';

export const META_RESPONSE_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      maxLength: 1000,
      description: '思慮深い応答メッセージ（説教的でなく共感的なトーン）',
    },
    suggestedAction: {
      type: 'string',
      enum: ['pause', 'hydrate', 'reflect'],
      description: '提案アクション（pause: 一息つく, hydrate: 水を飲む, reflect: 振り返る）',
    },
  },
  required: ['message', 'suggestedAction'],
} as const;
