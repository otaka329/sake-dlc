import { describe, it, expect, vi, beforeEach } from 'vitest';

// Powertools モック
vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: vi.fn(() => ({
    addContext: vi.fn(),
    appendKeys: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));
vi.mock('@aws-lambda-powertools/tracer', () => ({
  Tracer: vi.fn(() => ({
    getSegment: vi.fn(() => ({ addNewSubsegment: vi.fn(() => ({ close: vi.fn() })) })),
  })),
}));
vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({
    addMetric: vi.fn(),
    addDimension: vi.fn(),
    publishStoredMetrics: vi.fn(),
  })),
  MetricUnit: { Milliseconds: 'Milliseconds', Count: 'Count' },
}));

// レート制限モック
vi.mock('../../src/middleware/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}));

import { createHandler } from '../../src/middleware/create-handler';
import { z } from 'zod';

const mockContext = {} as any;

describe('createHandler ミドルウェア', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('JWT claims が欠如している場合 401 を返す', async () => {
    const handler = createHandler(
      { serviceName: 'test' },
      async () => ({ statusCode: 200, headers: {}, body: '{}' }),
    );

    const event = {
      httpMethod: 'GET',
      path: '/test',
      headers: {},
      body: null,
      requestContext: {
        requestId: 'test-id',
        authorizer: { claims: {} }, // sub と email が欠如
      },
    } as any;

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('AUTH_ERROR');
  });

  it('Zod バリデーション失敗時 400 を返す', async () => {
    const schema = z.object({ name: z.string().min(2) });

    const handler = createHandler(
      { serviceName: 'test', schema },
      async () => ({ statusCode: 200, headers: {}, body: '{}' }),
    );

    const event = {
      httpMethod: 'POST',
      path: '/test',
      headers: {},
      body: JSON.stringify({ name: 'a' }), // 1文字 → バリデーション失敗
      requestContext: {
        requestId: 'test-id',
        authorizer: {
          claims: { sub: 'user-123', email: 'test@example.com' },
        },
      },
    } as any;

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toBeDefined();
    expect(body.details.length).toBeGreaterThan(0);
  });

  it('不正な JSON ボディで 400 を返す', async () => {
    const schema = z.object({ name: z.string() });

    const handler = createHandler(
      { serviceName: 'test', schema },
      async () => ({ statusCode: 200, headers: {}, body: '{}' }),
    );

    const event = {
      httpMethod: 'POST',
      path: '/test',
      headers: {},
      body: 'not-json',
      requestContext: {
        requestId: 'test-id',
        authorizer: {
          claims: { sub: 'user-123', email: 'test@example.com' },
        },
      },
    } as any;

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(400);
  });

  it('ハンドラーが未知のエラーをスローした場合 500 を返す', async () => {
    const handler = createHandler(
      { serviceName: 'test' },
      async () => {
        throw new Error('予期しないエラー');
      },
    );

    const event = {
      httpMethod: 'GET',
      path: '/test',
      headers: {},
      body: null,
      requestContext: {
        requestId: 'test-id',
        authorizer: {
          claims: { sub: 'user-123', email: 'test@example.com' },
        },
      },
    } as any;

    const result = await handler(event, mockContext);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
