import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  InternalError,
} from '../../src/lib/errors';

describe('エラー階層', () => {
  it('ValidationError は 400 と VALIDATION_ERROR コードを持つ', () => {
    const err = new ValidationError('テストエラー', [
      { field: 'nickname', reason: '2文字以上' },
    ]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toHaveLength(1);
    expect(err).toBeInstanceOf(AppError);
  });

  it('AuthError は 401 と AUTH_ERROR コードを持つ', () => {
    const err = new AuthError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_ERROR');
  });

  it('ForbiddenError は 403 と FORBIDDEN コードを持つ', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('NotFoundError は 404 と NOT_FOUND コードを持つ', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('RateLimitError は 429 と RATE_LIMITED コードを持つ', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });

  it('InternalError は 500 と INTERNAL_ERROR コードを持つ', () => {
    const err = new InternalError();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('toResponse() は構造化エラーレスポンスを返す', () => {
    const err = new ValidationError('入力エラー', [
      { field: 'email', reason: '形式が不正' },
    ]);
    const response = err.toResponse();
    expect(response).toEqual({
      code: 'VALIDATION_ERROR',
      message: '入力エラー',
      details: [{ field: 'email', reason: '形式が不正' }],
    });
  });

  it('details なしの場合、toResponse() に details が含まれない', () => {
    const err = new AuthError();
    const response = err.toResponse();
    expect(response).toEqual({
      code: 'AUTH_ERROR',
      message: '認証が必要です',
    });
    expect(response).not.toHaveProperty('details');
  });
});
