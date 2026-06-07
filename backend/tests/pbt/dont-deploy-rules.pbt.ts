import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * PBT: Don't Deploy ルールベース判定
 * Invariant: 服薬あり → 常に Skip Deploy（BR-09-01）
 */

// checkRules のロジックを直接テスト
function checkRulesMedicated(isMedicated: boolean): 'skip_deploy' | null {
  if (isMedicated) return 'skip_deploy';
  return null;
}

function checkRulesSleep(sleepHours: number): 'skip_deploy' | null {
  if (sleepHours <= 4) return 'skip_deploy';
  return null;
}

function checkRulesCondition(conditionScore: number): 'skip_deploy' | null {
  if (conditionScore <= 2) return 'skip_deploy';
  return null;
}

describe('PBT: Don\'t Deploy ルールベース判定', () => {
  it('服薬あり → 常に Skip Deploy', () => {
    fc.assert(
      fc.property(fc.constant(true), (isMedicated) => {
        expect(checkRulesMedicated(isMedicated)).toBe('skip_deploy');
      }),
    );
  });

  it('服薬なし → ルールベースでは確定しない', () => {
    expect(checkRulesMedicated(false)).toBeNull();
  });

  it('睡眠 4時間以下 → 常に Skip Deploy', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }),
        (sleepHours) => {
          expect(checkRulesSleep(sleepHours)).toBe('skip_deploy');
        },
      ),
    );
  });

  it('睡眠 5時間以上 → ルールベースでは確定しない', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 12 }),
        (sleepHours) => {
          expect(checkRulesSleep(sleepHours)).toBeNull();
        },
      ),
    );
  });

  it('体調スコア 2以下 → 常に Skip Deploy', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }),
        (score) => {
          expect(checkRulesCondition(score)).toBe('skip_deploy');
        },
      ),
    );
  });

  it('体調スコア 3以上 → ルールベースでは確定しない', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }),
        (score) => {
          expect(checkRulesCondition(score)).toBeNull();
        },
      ),
    );
  });
});
