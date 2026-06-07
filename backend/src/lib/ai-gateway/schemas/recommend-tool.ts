/**
 * 推薦 Tool Use スキーマ（Bedrock Claude Tool Use input_schema）
 * BR-08-01: 3〜5件、matchScore [0,1]、reason maxLength 500
 * NFR Design §1.2: スキーマレベルで構造制約を強制
 */
export const RECOMMEND_TOOL_NAME = 'recommend_sake';
export const RECOMMEND_TOOL_DESCRIPTION = '日本酒推薦結果を構造化出力。3〜5件の推薦銘柄を返してください。';

export const RECOMMEND_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          brandId: { type: 'integer', description: 'さけのわ銘柄ID' },
          brandName: { type: 'string', maxLength: 100, description: '銘柄名' },
          matchScore: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'ユーザー嗜好との適合度（0.0〜1.0）。味覚プロファイルとの類似度+料理相性を総合判断',
          },
          temperature: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['reishu', 'jouon', 'nurukan', 'atsukan'] },
              celsius: { type: 'integer', minimum: 0, maximum: 100 },
              label: { type: 'string', maxLength: 50, description: '日本語ラベル（冷やして/常温で/ぬる燗で/熱燗で）' },
              labelEn: { type: 'string', maxLength: 50, description: '英語ラベル（chilled/room temp/warm/hot）' },
            },
            required: ['type', 'celsius', 'label', 'labelEn'],
          },
          amount: { type: 'integer', minimum: 30, maximum: 300, description: '適量（ml）' },
          vessel: { type: 'string', maxLength: 50, description: '推奨器（猪口/ぐい呑み/ワイングラス等）' },
          reason: { type: 'string', maxLength: 500, description: '推薦理由（2〜3文）' },
        },
        required: ['brandId', 'brandName', 'matchScore', 'temperature', 'amount', 'vessel', 'reason'],
      },
    },
  },
  required: ['recommendations'],
} as const;
