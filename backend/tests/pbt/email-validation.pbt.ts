import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { z } from 'zod';

/**
 * PBT: メールバリデーション（BR-01-01）
 * PBT-03: Invariant — RFC 5322 準拠で合格
 */

const emailSchema = z.string().email();

describe('PBT: メールバリデーション', () => {
  it('fast-check の emailAddress() で生成されたメールは常に合格する', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      }),
    );
  });

  it('@ を含まない文字列は常に不合格する', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
        (notEmail) => {
          const result = emailSchema.safeParse(notEmail);
          expect(result.success).toBe(false);
        },
      ),
    );
  });

  it('空文字は不合格する', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
