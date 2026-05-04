import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validPasswordArb, tooShortPasswordArb } from './generators/password';

/**
 * PBT: パスワードバリデーション（BR-01）
 * PBT-03: Invariant — 15文字以上で合格、14文字以下で不合格
 */

// パスワード長バリデーション（単一要素認証時）
function validatePasswordLength(password: string, mfaEnabled = false): boolean {
  const minLength = mfaEnabled ? 8 : 15;
  return password.length >= minLength;
}

describe('PBT: パスワードバリデーション', () => {
  it('15文字以上のパスワードは常に合格する（単一要素認証）', () => {
    fc.assert(
      fc.property(validPasswordArb, (password) => {
        expect(validatePasswordLength(password, false)).toBe(true);
      }),
    );
  });

  it('14文字以下のパスワードは常に不合格する（単一要素認証）', () => {
    fc.assert(
      fc.property(tooShortPasswordArb, (password) => {
        expect(validatePasswordLength(password, false)).toBe(false);
      }),
    );
  });

  it('8文字以上のパスワードは MFA 有効時に合格する', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 64 }),
        (password) => {
          expect(validatePasswordLength(password, true)).toBe(true);
        },
      ),
    );
  });
});
