import { describe, it, expect } from 'vitest';
import { updateDisclosureLevelSchema } from '@sdlc/shared-types';

describe('PUT /disclosure-level — バリデーション', () => {
  it('unlock_category + type を受け付ける', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_category',
      category: 'type',
    });
    expect(result.success).toBe(true);
  });

  it('unlock_category + region を受け付ける', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_category',
      category: 'region',
    });
    expect(result.success).toBe(true);
  });

  it('unlock_category + temperature を受け付ける', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_category',
      category: 'temperature',
    });
    expect(result.success).toBe(true);
  });

  it('unlock_category + vessel を拒否する（Layer 3 項目）', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_category',
      category: 'vessel',
    });
    expect(result.success).toBe(false);
  });

  it('unlock_category + seasonal を拒否する（Layer 3 項目）', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_category',
      category: 'seasonal',
    });
    expect(result.success).toBe(false);
  });

  it('unlock_all を受け付ける', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_all',
    });
    expect(result.success).toBe(true);
  });

  it('不正な action を拒否する', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('unlock_category で category なしを拒否する', () => {
    const result = updateDisclosureLevelSchema.safeParse({
      action: 'unlock_category',
    });
    expect(result.success).toBe(false);
  });
});
