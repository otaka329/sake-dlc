import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { signupRequestSchema } from '@sdlc/shared-types';

/**
 * PBT: ニックネームバリデーション（BR-03）
 * PBT-03: Invariant — 2-20文字、許可文字のみ
 */

describe('PBT: ニックネームバリデーション', () => {
  it('2〜20文字の英数字ニックネームは常に合格する', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')), {
          minLength: 2,
          maxLength: 20,
        }),
        (nickname) => {
          const result = signupRequestSchema.safeParse({
            nickname,
            locale: 'ja',
          });
          expect(result.success).toBe(true);
        },
      ),
    );
  });

  it('1文字以下のニックネームは常に不合格する', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1 }),
        (nickname) => {
          const result = signupRequestSchema.safeParse({
            nickname,
            locale: 'ja',
          });
          expect(result.success).toBe(false);
        },
      ),
    );
  });
});
