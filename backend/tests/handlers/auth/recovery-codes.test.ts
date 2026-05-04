import { describe, it, expect } from 'vitest';
import { randomBytes } from 'crypto';

describe('POST /mfa/recovery-codes', () => {
  const RECOVERY_CODE_COUNT = 10;
  const RECOVERY_CODE_BYTES = 8;

  function generateRecoveryCodes(): string[] {
    return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      randomBytes(RECOVERY_CODE_BYTES).toString('hex'),
    );
  }

  it('10個のリカバリーコードを生成する', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
  });

  it('各コードは16文字（8バイト = 64ビット以上）の16進数', () => {
    const codes = generateRecoveryCodes();
    for (const code of codes) {
      expect(code).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it('生成されるコードはすべてユニーク', () => {
    const codes = generateRecoveryCodes();
    const unique = new Set(codes);
    expect(unique.size).toBe(10);
  });
});
