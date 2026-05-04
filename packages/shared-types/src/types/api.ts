/**
 * API レスポンスの共通型定義
 */

/** API Gateway Lambda プロキシ統合のレスポンス型 */
export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/** 認証済みリクエストのコンテキスト */
export interface AuthContext {
  userId: string;
  email: string;
}

/** ページネーション パラメータ */
export interface PaginationParams {
  limit?: number;
  lastKey?: string;
}

/** ページネーション レスポンス */
export interface PaginatedResponse<T> {
  items: T[];
  lastKey?: string;
  count: number;
}
