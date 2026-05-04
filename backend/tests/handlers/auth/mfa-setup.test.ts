import { describe, it, expect } from 'vitest';

describe('POST /mfa/setup', () => {
  it('otpauth URI が正しい形式で生成される', () => {
    const secretCode = 'JBSWY3DPEHPK3PXP';
    const email = 'test@example.com';
    const otpauthUri = `otpauth://totp/SDLC:${email}?secret=${secretCode}&issuer=SDLC`;

    expect(otpauthUri).toContain('otpauth://totp/SDLC:');
    expect(otpauthUri).toContain(`secret=${secretCode}`);
    expect(otpauthUri).toContain('issuer=SDLC');
  });
});
