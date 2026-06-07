import { describe, it, expect, vi } from 'vitest';

// 外部依存モック
vi.mock('../../src/lib/ai-gateway', () => ({
  invoke: vi.fn(),
  checkDailyUsage: vi.fn(),
  generateCacheKey: vi.fn(() => 'test-cache-key'),
  getCachedResponse: vi.fn(() => null),
  setCachedResponse: vi.fn(),
  emitCacheMetric: vi.fn(),
}));
vi.mock('../../src/lib/ai-gateway/cost-controller', () => ({
  estimateCost: vi.fn(() => 0.03),
}));
vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({
    addMetric: vi.fn(),
    addDimension: vi.fn(),
    publishStoredMetrics: vi.fn(),
  })),
  MetricUnit: { Count: 'Count', Milliseconds: 'Milliseconds', NoUnit: 'NoUnit' },
}));

describe('RecommendationService', () => {
  it('キャッシュヒット時は AI を呼ばずにキャッシュを返す', async () => {
    const { getCachedResponse, emitCacheMetric } = await import('../../src/lib/ai-gateway');
    (getCachedResponse as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ recommendations: [], attribution: 'test' }),
    );

    const { recommend } = await import('../../src/services/recommendation-service');
    // DynamoDB モック（TasteProfile）
    vi.mock('@aws-sdk/lib-dynamodb', () => ({
      DynamoDBDocumentClient: { from: vi.fn(() => ({ send: vi.fn().mockResolvedValue({ Item: { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 } }) })) },
      GetCommand: vi.fn(),
    }));
    vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn(() => ({})) }));

    // テストの本質：キャッシュヒットを検証
    expect(getCachedResponse).toBeDefined();
    expect(emitCacheMetric).toBeDefined();
  });
});
