import { describe, it, expect } from 'vitest';
import { planInputSchema } from '@sdlc/shared-types';

// --- スキーマバリデーションテスト ---
describe('POST /recommend — 入力バリデーション', () => {
  it('有効な PlanInput を受け付ける', () => {
    const result = planInputSchema.safeParse({
      conditionScore: 4,
      isMedicated: false,
      sleepHours: 7,
      dishes: [{ name: '刺身', source: 'text' }],
      mood: '元気',
    });
    expect(result.success).toBe(true);
  });

  it('空の PlanInput（全フィールド optional）を受け付ける', () => {
    const result = planInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('conditionScore 範囲外（6）を拒否する', () => {
    const result = planInputSchema.safeParse({ conditionScore: 6 });
    expect(result.success).toBe(false);
  });

  it('tomorrowEarliestStart 不正形式（25:00）を拒否する', () => {
    const result = planInputSchema.safeParse({ tomorrowEarliestStart: '25:00' });
    expect(result.success).toBe(false);
  });

  it('dishes に 10件超を拒否する', () => {
    const dishes = Array.from({ length: 11 }, (_, i) => ({ name: `料理${i}`, source: 'text' }));
    const result = planInputSchema.safeParse({ dishes });
    expect(result.success).toBe(false);
  });

  it('tomorrowEarliestStart 有効形式（07:30）を受け付ける', () => {
    const result = planInputSchema.safeParse({ tomorrowEarliestStart: '07:30' });
    expect(result.success).toBe(true);
  });
});
