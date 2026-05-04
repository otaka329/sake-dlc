import { describe, it, expect } from 'vitest';
import { mfaVerifyRequestSchema } from '@sdlc/shared-types';

describe('POST /mfa/verify — バリデーション', () => {
  it('6桁数字の TOTP コードを受け付ける', () => {
    const result = mfaVerifyRequestSchema.safeParse({ totpCode: '123456' });
    expect(result.success).toBe(true);
  });

  it('5桁の TOTP コードを拒否する', () => {
    const result = mfaVerifyRequestSchema.safeParse({ totpCode: '12345' });
    expect(result.success).toBe(false);
  });

  it('7桁の TOTP コードを拒否する', () => {
    const result = mfaVerifyRequestSchema.safeParse({ totpCode: '1234567' });
    expect(result.success).toBe(false);
  });

  it('英字を含む TOTP コードを拒否する', () => {
    const result = mfaVerifyRequestSchema.safeParse({ totpCode: '12345a' });
    expect(result.success).toBe(false);
  });

  it('空文字の TOTP コードを拒否する', () => {
    const result = mfaVerifyRequestSchema.safeParse({ totpCode: '' });
    expect(result.success).toBe(false);
  });
});
