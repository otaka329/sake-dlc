/**
 * ノンアル代替提案 Tool Use スキーマ
 * BR-10: 1〜3件の代替提案 + 理由 + 季節性
 */
export const ALTERNATIVE_TOOL_NAME = 'suggest_alternatives';
export const ALTERNATIVE_TOOL_DESCRIPTION = 'ノンアルコール飲料の代替提案を1〜3件、理由付きで返してください。';

export const ALTERNATIVE_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    alternatives: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 100, description: '代替ドリンク名' },
          reason: { type: 'string', maxLength: 300, description: '提案理由' },
          season: { type: 'string', maxLength: 20, description: '季節性（春/夏/秋/冬/通年）' },
        },
        required: ['name', 'reason'],
      },
    },
  },
  required: ['alternatives'],
} as const;
