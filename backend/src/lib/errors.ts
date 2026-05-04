import type { ErrorCode, ErrorResponse } from '@sdlc/shared-types';

/**
 * アプリケーションエラー基底クラス
 * SECURITY-09, SECURITY-15: 構造化エラーレスポンス、Fail-closed
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Array<{ field: string; reason: string }>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  /** 構造化エラーレスポンスに変換 */
  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/** 400: Zod バリデーション失敗 */
export class ValidationError extends AppError {
  constructor(
    message = '入力内容に問題があります',
    details?: Array<{ field: string; reason: string }>,
  ) {
    super('VALIDATION_ERROR', 400, message, details);
    this.name = 'ValidationError';
  }
}

/** 401: トークン無効・期限切れ */
export class AuthError extends AppError {
  constructor(message = '認証が必要です') {
    super('AUTH_ERROR', 401, message);
    this.name = 'AuthError';
  }
}

/** 403: リソースへのアクセス権なし（IDOR 防止） */
export class ForbiddenError extends AppError {
  constructor(message = 'アクセスが拒否されました') {
    super('FORBIDDEN', 403, message);
    this.name = 'ForbiddenError';
  }
}

/** 404: リソース不存在 */
export class NotFoundError extends AppError {
  constructor(message = 'リソースが見つかりません') {
    super('NOT_FOUND', 404, message);
    this.name = 'NotFoundError';
  }
}

/** 429: レート制限超過 */
export class RateLimitError extends AppError {
  constructor(message = 'リクエスト数が上限を超えています') {
    super('RATE_LIMITED', 429, message);
    this.name = 'RateLimitError';
  }
}

/** 500: 予期しないエラー（詳細はログのみ） */
export class InternalError extends AppError {
  constructor(message = 'サーバーエラーが発生しました') {
    super('INTERNAL_ERROR', 500, message);
    this.name = 'InternalError';
  }
}
