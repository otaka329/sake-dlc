import { describe, it, expect } from 'vitest';
import { success, error, created, noContent } from '../../src/lib/response';

describe('レスポンスヘルパー', () => {
  it('success() は 200 と JSON ボディを返す', () => {
    const res = success({ message: 'ok' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: 'ok' });
    expect(res.headers['Content-Type']).toBe('application/json');
  });

  it('created() は 201 を返す', () => {
    const res = created({ id: '123' });
    expect(res.statusCode).toBe(201);
  });

  it('noContent() は 204 と空ボディを返す', () => {
    const res = noContent();
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe('');
  });

  it('error() は指定ステータスコードとエラーボディを返す', () => {
    const res = error({ code: 'VALIDATION_ERROR', message: 'テスト' }, 400);
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'テスト',
    });
  });
});
