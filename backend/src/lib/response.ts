import type { ApiResponse } from '@sdlc/shared-types';
import type { ErrorResponse } from '@sdlc/shared-types';

/**
 * 構造化レスポンスヘルパー
 * CORS ヘッダーは API Gateway 側で管理するため、Lambda では付与しない
 */

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

/** 成功レスポンス */
export function success(body: unknown, statusCode = 200): ApiResponse {
  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(body),
  };
}

/** エラーレスポンス */
export function error(errorResponse: ErrorResponse, statusCode: number): ApiResponse {
  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(errorResponse),
  };
}

/** 201 Created */
export function created(body: unknown): ApiResponse {
  return success(body, 201);
}

/** 204 No Content */
export function noContent(): ApiResponse {
  return {
    statusCode: 204,
    headers: DEFAULT_HEADERS,
    body: '',
  };
}
