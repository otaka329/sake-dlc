import { describe, it, expect } from 'vitest';
import { planInputSchema } from '@sdlc/shared-types';

describe('POST /dont-deploy — 入力バリデーション', () => {
  it('有効な PlanInput を受け付ける', () => {
    const result = planInputSchema.safeParse({
      conditionScore: 3,
      isMedicated: true,
      sleepHours: 5,
      tomorrowScheduleImportance: 4,
      tomorrowEarliestStart: '09:00',
    });
    expect(result.success).toBe(true);
  });

  it('sleepHours 負数を拒否する', () => {
    const result = planInputSchema.safeParse({ sleepHours: -1 });
    expect(result.success).toBe(false);
  });

  it('tomorrowScheduleImportance 範囲外（0）を拒否する', () => {
    const result = planInputSchema.safeParse({ tomorrowScheduleImportance: 0 });
    expect(result.success).toBe(false);
  });
});
