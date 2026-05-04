import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '@sdlc/shared-types';

describe('PUT /profile — バリデーション', () => {
  it('有効なニックネーム更新を受け付ける', () => {
    const result = updateProfileSchema.safeParse({ nickname: 'テスト太郎' });
    expect(result.success).toBe(true);
  });

  it('有効なロケール更新を受け付ける', () => {
    const result = updateProfileSchema.safeParse({ locale: 'en' });
    expect(result.success).toBe(true);
  });

  it('1文字のニックネームを拒否する', () => {
    const result = updateProfileSchema.safeParse({ nickname: 'あ' });
    expect(result.success).toBe(false);
  });

  it('21文字のニックネームを拒否する', () => {
    const result = updateProfileSchema.safeParse({ nickname: 'あ'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('不正な文字を含むニックネームを拒否する', () => {
    const result = updateProfileSchema.safeParse({ nickname: 'test@user' });
    expect(result.success).toBe(false);
  });

  it('無効なロケールを拒否する', () => {
    const result = updateProfileSchema.safeParse({ locale: 'fr' });
    expect(result.success).toBe(false);
  });

  it('空オブジェクトを受け付ける（部分更新）', () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
