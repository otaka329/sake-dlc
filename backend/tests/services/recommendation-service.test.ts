import { describe, it, expect, vi, beforeEach } from 'vitest';

// DynamoDB モック
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: vi.fn(() => ({})) }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  GetCommand: vi.fn((params) => ({ input: params })),
  PutCommand: vi.fn((params) => ({ input: params })),
  UpdateCommand: vi.fn((params) => ({ input: params })),
  QueryCommand: vi.fn((params) => ({ input: params })),
}));

// Powertools モック
vi.mock('@aws-lambda-powertools/logger', () => ({
  Logger: vi.fn(() => ({ addContext: vi.fn(), appendKeys: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })),
}));
vi.mock('@aws-lambda-powertools/metrics', () => ({
  Metrics: vi.fn(() => ({ addMetric: vi.fn(), addDimension: vi.fn(), publishStoredMetrics: vi.fn() })),
  MetricUnit: { Count: 'Count', Milliseconds: 'Milliseconds', NoUnit: 'NoUnit' },
}));

// AIGateway invoke モック
const mockInvoke = vi.fn();
const mockCheckDailyUsage = vi.fn();
const mockGetCachedResponse = vi.fn();
const mockSetCachedResponse = vi.fn();
const mockEmitCacheMetric = vi.fn();

vi.mock('../../src/lib/ai-gateway', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
  checkDailyUsage: (...args: unknown[]) => mockCheckDailyUsage(...args),
  generateCacheKey: vi.fn(() => 'mock-cache-key'),
  getCachedResponse: (...args: unknown[]) => mockGetCachedResponse(...args),
  setCachedResponse: (...args: unknown[]) => mockSetCachedResponse(...args),
  emitCacheMetric: (...args: unknown[]) => mockEmitCacheMetric(...args),
}));
vi.mock('../../src/lib/ai-gateway/cost-controller', () => ({
  estimateCost: vi.fn(() => 0.03),
}));

import { recommend } from '../../src/services/recommendation-service';

describe('RecommendationService - recommend()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // TasteProfile 取得のデフォルトモック
    mockSend.mockResolvedValue({ Item: { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 } });
    mockGetCachedResponse.mockResolvedValue(null);
    mockSetCachedResponse.mockResolvedValue(undefined);
    mockCheckDailyUsage.mockResolvedValue(undefined);
  });

  it('キャッシュヒット時は AI を呼ばずキャッシュを返す', async () => {
    const cachedData = { recommendations: [{ brandId: 1, brandName: 'テスト' }], attribution: 'test' };
    mockGetCachedResponse.mockResolvedValueOnce(JSON.stringify(cachedData));

    const result = await recommend({ dishes: [{ name: '刺身', source: 'text' }] }, 'user-1', 1, 'ja');

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockEmitCacheMetric).toHaveBeenCalledWith(true);
    expect(result).toEqual(cachedData);
  });

  it('キャッシュミス時は AI を呼び、flavorScores を Lambda で付与する', async () => {
    // SakenowaCache フレーバーデータ（2回目の GetCommand）
    mockSend
      .mockResolvedValueOnce({ Item: { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 } }) // TasteProfile
      .mockResolvedValueOnce({ Item: { data: JSON.stringify([{ brandId: 1, f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.4, f5: 0.5, f6: 0.7 }]) } }); // SakenowaCache

    mockInvoke.mockResolvedValueOnce({
      isDryRun: false,
      data: {
        recommendations: [
          { brandId: 1, brandName: '獺祭', matchScore: 0.9, temperature: { type: 'reishu', celsius: 10, label: '冷やして', labelEn: 'chilled' }, amount: 90, vessel: 'ワイングラス', reason: 'テスト理由' },
          { brandId: 2, brandName: '久保田', matchScore: 0.8, temperature: { type: 'jouon', celsius: 20, label: '常温で', labelEn: 'room temp' }, amount: 90, vessel: '猪口', reason: '理由2' },
          { brandId: 3, brandName: '八海山', matchScore: 0.7, temperature: { type: 'nurukan', celsius: 40, label: 'ぬる燗で', labelEn: 'warm' }, amount: 90, vessel: 'ぐい呑み', reason: '理由3' },
        ],
      },
      response: { output: '', inputTokens: 2000, outputTokens: 1500, modelId: 'sonnet', latencyMs: 3000 },
    });

    const result = await recommend({ dishes: [{ name: '刺身', source: 'text' }] }, 'user-1', 1, 'ja');

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockEmitCacheMetric).toHaveBeenCalledWith(false);
    expect(mockSetCachedResponse).toHaveBeenCalled();

    if (!('_dryRun' in result)) {
      // flavorScores が Lambda から付与されている（brandId:1 は SakenowaCache にある）
      expect(result.recommendations[0].flavorScores).toEqual({ f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.4, f5: 0.5, f6: 0.7 });
      // brandId:2,3 は SakenowaCache にないので null
      expect(result.recommendations[1].flavorScores).toBeNull();
      expect(result.recommendations[2].flavorScores).toBeNull();
      expect(result.attribution).toContain('さけのわ');
    }
  });

  it('ドライラン時は _dryRun:true + response を返す', async () => {
    mockInvoke.mockResolvedValueOnce({
      isDryRun: true,
      data: null,
      response: { output: '{"_dryRun":true}', inputTokens: 0, outputTokens: 0, modelId: 'stub', latencyMs: 0 },
    });

    // SakenowaCache
    mockSend
      .mockResolvedValueOnce({ Item: { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 } })
      .mockResolvedValueOnce({ Item: null });

    const result = await recommend({ dishes: [{ name: '刺身', source: 'text' }] }, 'user-1', 1, 'ja');

    expect('_dryRun' in result).toBe(true);
  });

  it('checkDailyUsage が呼ばれる', async () => {
    mockSend.mockResolvedValue({ Item: { f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.5, f5: 0.5, f6: 0.5 } });
    mockInvoke.mockResolvedValueOnce({
      isDryRun: false,
      data: { recommendations: [
        { brandId: 1, brandName: 'A', matchScore: 0.9, temperature: { type: 'jouon', celsius: 20, label: '常温', labelEn: 'room' }, amount: 90, vessel: '猪口', reason: 'r' },
        { brandId: 2, brandName: 'B', matchScore: 0.8, temperature: { type: 'jouon', celsius: 20, label: '常温', labelEn: 'room' }, amount: 90, vessel: '猪口', reason: 'r' },
        { brandId: 3, brandName: 'C', matchScore: 0.7, temperature: { type: 'jouon', celsius: 20, label: '常温', labelEn: 'room' }, amount: 90, vessel: '猪口', reason: 'r' },
      ] },
      response: { output: '', inputTokens: 100, outputTokens: 50, modelId: 'test', latencyMs: 100 },
    });

    await recommend({}, 'user-1', 1, 'ja');
    expect(mockCheckDailyUsage).toHaveBeenCalledWith('user-1');
  });
});
