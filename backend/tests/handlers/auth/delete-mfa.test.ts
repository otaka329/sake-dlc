import { describe, it, expect } from 'vitest';
import { mfaDeleteRequestSchema } from '@sdlc/shared-types';

describe('DELETE /mfa — バリデーション', () => {
  it('TOTP コードのみで受け付ける', () => {
    const result = mfaDeleteRequestSchema.safeParse({ totpCode: '123456' });
    expect(result.success).toBe(true);
  });

  it('リカバリーコードのみで受け付ける', () => {
    const result = mfaDeleteRequestSchema.safeParse({ recoveryCode: 'abcdef0123456789' });
    expect(result.success).toBe(true);
  });

  it('両方指定でも受け付ける', () => {
    const result = mfaDeleteRequestSchema.safeParse({
      totpCode: '123456',
      recoveryCode: 'abcdef0123456789',
    });
    expect(result.success).toBe(true);
  });

  it('どちらも未指定の場合は拒否する', () => {
    const result = mfaDeleteRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
