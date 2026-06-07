import { describe, it, expect, vi } from 'vitest';

// AI Gateway モック
vi.mock('../../src/lib/ai-gateway', () => ({
  invoke: vi.fn().mockResolvedValue({
    isDryRun: false,
    data: { decision: 'deploy', confidence: 0.6, reason: 'テスト理由' },
    response: { output: '', inputTokens: 0, outputTokens: 0, modelId: 'test', latencyMs: 0 },
  }),
}));

describe('DontDeployService - checkRules (ルールベース判定)', () => {
  it('服薬あり → Skip Deploy（BR-09-01）', async () => {
    const { judge } = await import('../../src/services/dont-deploy-service');
    const result = await judge({ isMedicated: true }, 'user-1', 'ja');
    expect(result).not.toHaveProperty('_dryRun');
    if (!('_dryRun' in result)) {
      expect(result.decision).toBe('skip_deploy');
      expect(result.ruleBased).toBe(true);
      expect(result.reason).toContain('服薬');
    }
  });

  it('体調スコア 2 → Skip Deploy（BR-09-02）', async () => {
    const { judge } = await import('../../src/services/dont-deploy-service');
    const result = await judge({ conditionScore: 2 }, 'user-1', 'ja');
    expect(result).not.toHaveProperty('_dryRun');
    if (!('_dryRun' in result)) {
      expect(result.decision).toBe('skip_deploy');
      expect(result.ruleBased).toBe(true);
    }
  });

  it('睡眠 4時間以下 → Skip Deploy（BR-09-03）', async () => {
    const { judge } = await import('../../src/services/dont-deploy-service');
    const result = await judge({ sleepHours: 3 }, 'user-1', 'ja');
    expect(result).not.toHaveProperty('_dryRun');
    if (!('_dryRun' in result)) {
      expect(result.decision).toBe('skip_deploy');
      expect(result.ruleBased).toBe(true);
    }
  });

  it('重要予定5 + 早朝 → Skip Deploy（BR-09-04）', async () => {
    const { judge } = await import('../../src/services/dont-deploy-service');
    const result = await judge(
      { tomorrowScheduleImportance: 5, tomorrowEarliestStart: '07:00' },
      'user-1', 'ja',
    );
    expect(result).not.toHaveProperty('_dryRun');
    if (!('_dryRun' in result)) {
      expect(result.decision).toBe('skip_deploy');
      expect(result.ruleBased).toBe(true);
    }
  });

  it('体調良好・服薬なし・睡眠十分 → AI 判定（グレーゾーン）', async () => {
    const { judge } = await import('../../src/services/dont-deploy-service');
    const result = await judge(
      { conditionScore: 4, isMedicated: false, sleepHours: 7 },
      'user-1', 'ja',
    );
    expect(result).not.toHaveProperty('_dryRun');
    if (!('_dryRun' in result)) {
      expect(result.ruleBased).toBe(false);
    }
  });
});
