import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { maskPii } from '../../src/lib/logger';

/**
 * PBT: PII マスク（NFR Design §7）
 * PBT-03: Invariant — マスク後の出力に email/password の平文が含まれない
 */

describe('PBT: PII マスク', () => {
  it('マスク後に email の平文が含まれない', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          const masked = maskPii({ email });
          const maskedStr = JSON.stringify(masked);
          // 元の email がそのまま含まれないことを検証
          // （マスク後は ***@domain 形式）
          expect(maskedStr).not.toContain(`"${email}"`);
          // ドメイン部分は残る（仕様通り）
          const domain = email.split('@')[1];
          expect(masked.email).toContain(`@${domain}`);
        },
      ),
    );
  });

  it('マスク後に password の平文が含まれない', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 64 }),
        (password) => {
          const masked = maskPii({ password });
          expect(masked.password).toBe('[REDACTED]');
        },
      ),
    );
  });

  it('PII でないフィールドはマスクされない', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (value) => {
          const masked = maskPii({ nickname: value });
          expect(masked.nickname).toBe(value);
        },
      ),
    );
  });
});
