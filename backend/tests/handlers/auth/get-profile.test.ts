import { describe, it, expect, vi, beforeEach } from 'vitest';

// DynamoDB モック
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({ send: mockSend })),
  },
  GetCommand: vi.fn((params) => ({ input: params })),
}));

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

// レート制限モック（テスト対象外）
vi.mock('../../../src/middleware/rate-limiter', () => ({
  checkRateLimit: vi.fn(),
}));

import { handler } from '../../../src/handlers/auth/get-profile';

const mockEvent = (userId: string) => ({
  httpMethod: 'GET',
  path: '/profile',
  headers: {},
  body: null,
  requestContext: {
    requestId: 'test-request-id',
    authorizer: {
      claims: { sub: userId, email: 'test@example.com' },
    },
  },
} as any);

const mockContext = {} as any;

describe('GET /profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('存在するユーザーのプロファイルを 200 で返す', async () => {
    const mockItem = {
      userId: 'test-user-id',
      entityType: 'PROFILE',
      email: 'test@example.com',
      nickname: 'テスト太郎',
      locale: 'ja',
      sakeExperience: 'beginner',
      authProvider: 'email',
      disclosureLevel: 1,
      unlockedCategories: [],
      googleCalendarLinked: false,
      notificationEnabled: true,
      mfaEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    mockSend.mockResolvedValueOnce({ Item: mockItem });

    const result = await handler(mockEvent('test-user-id'), mockContext);
    expect(result.statusCode).toBe(200);

    const body = JSON.parse(result.body);
    expect(body.userId).toBe('test-user-id');
    expect(body.nickname).toBe('テスト太郎');
    expect(body.disclosureLevel).toBe(1);
  });

  it('存在しないユーザーは 404 を返す', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const result = await handler(mockEvent('nonexistent-user'), mockContext);
    expect(result.statusCode).toBe(404);

    const body = JSON.parse(result.body);
    expect(body.code).toBe('NOT_FOUND');
  });
});
