import { describe, it, expect } from 'vitest';
import { metaResponseRequestSchema } from '@sdlc/shared-types';

describe('POST /meta-response — 入力バリデーション', () => {
  it('有効なメッセージを受け付ける', () => {
    const result = metaResponseRequestSchema.safeParse({ message: '飲むべき？' });
    expect(result.success).toBe(true);
  });

  it('空メッセージを拒否する', () => {
    const result = metaResponseRequestSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('500文字超のメッセージを拒否する', () => {
    const result = metaResponseRequestSchema.safeParse({ message: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('message フィールドなしを拒否する', () => {
    const result = metaResponseRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
