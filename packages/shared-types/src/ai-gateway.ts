import type { DisclosureLevel } from './schemas/user';

/**
 * CM-01 AIGateway インターフェース
 * Unit 1 ではインターフェース定義＋スタブ。Unit 2 で Bedrock 本実装に差し替え。
 */

export interface AIGatewayRequest {
  /** プロンプトテンプレート ID */
  templateId: string;
  /** Bedrock モデル ID */
  modelId: string;
  /** テンプレート変数 */
  input: Record<string, unknown>;
  /** レスポンスキャッシュ用キー（Unit 2 で実装） */
  cacheKey?: string;
  /** ユーザーの開示レイヤー（出力フォーマット切り替え用） */
  disclosureLevel?: DisclosureLevel;
}

export interface AIGatewayResponse {
  /** AI 生成テキスト */
  output: string;
  /** 入力トークン数（コスト計装） */
  inputTokens: number;
  /** 出力トークン数（コスト計装） */
  outputTokens: number;
  /** 使用モデル ID */
  modelId: string;
  /** Bedrock API レイテンシ（ms） */
  latencyMs: number;
}

/**
 * AIGateway スタブ実装
 * Unit 1 では固定レスポンスを返却
 */
export async function invokeAIGatewayStub(_request: AIGatewayRequest): Promise<AIGatewayResponse> {
  return {
    output: '[AIGateway スタブ] この機能は Unit 2 で実装されます。',
    inputTokens: 0,
    outputTokens: 0,
    modelId: 'stub',
    latencyMs: 0,
  };
}
