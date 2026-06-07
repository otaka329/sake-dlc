import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: Don't Deploy ルールベース判定（本番コード judge() 経由）
 * Invariant: 服薬あり → 常に Skip Deploy（BR-09-01）
 */

vi.mock('../../src/lib/ai-gateway', () => ({
  invoke: vi.fn().mockResolvedValue({
    isDryRun: false,
    data: { decision: 'deploy', confidence: 0.5, reason: 'AI判定' },
    response: { output: '', inputTokens: 0, outputTokens: 0, modelId: 'test', latencyMs: 0 },
  }),
}));

import { judge } from '../../src/services/dont-deploy-service';

describe('PBT: dont-deploy ルールベース判定（本番コード）', () => {
  it('服薬あり → 常に skip_deploy + ruleBased=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (_score) => {
          const result = await judge({ isMedicated: true }, 'user', 'ja');
          expect(result).not.toHaveProperty('_dryRun');
          if (!('_dryRun' in result)) {
            expect(result.decision).toBe('skip_deploy');
            expect(result.ruleBased).toBe(true);
          }
        },
      ),
    );
  });

  it('睡眠 0〜4 時間 → 常に skip_deploy + ruleBased=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 4 }),
        async (sleepHours) => {
          const result = await judge({ sleepHours, isMedicated: false }, 'user', 'ja');
          expect(result).not.toHaveProperty('_dryRun');
          if (!('_dryRun' in result)) {
            expect(result.decision).toBe('skip_deploy');
            expect(result.ruleBased).toBe(true);
          }
        },
      ),
    );
  });

  it('体調 1〜2 → 常に skip_deploy + ruleBased=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2 }),
        async (conditionScore) => {
          const result = await judge({ conditionScore, isMedicated: false, sleepHours: 8 }, 'user', 'ja');
          expect(result).not.toHaveProperty('_dryRun');
          if (!('_dryRun' in result)) {
            expect(result.decision).toBe('skip_deploy');
            expect(result.ruleBased).toBe(true);
          }
        },
      ),
    );
  });

  it('体調良好 + 睡眠十分 + 服薬なし → ruleBased=false（AI 判定へ）', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 5 }),
        fc.integer({ min: 5, max: 10 }),
        async (conditionScore, sleepHours) => {
          const result = await judge(
            { conditionScore, sleepHours, isMedicated: false },
            'user', 'ja',
          );
          expect(result).not.toHaveProperty('_dryRun');
          if (!('_dryRun' in result)) {
            expect(result.ruleBased).toBe(false);
          }
        },
      ),
    );
  });
});
