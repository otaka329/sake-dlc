import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { signupRequestSchema } from '@sdlc/shared-types';

/**
 * PBT: Zod スキーマ Round-trip
 * PBT-02: parse → serialize → parse が等価
 */

describe('PBT: Zod スキーマ Round-trip', () => {
  it('signupRequestSchema: parse → JSON.stringify → parse が等価', () => {
    fc.assert(
      fc.property(
        fc.record({
          nickname: fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
            { minLength: 2, maxLength: 20 },
          ),
          locale: fc.constantFrom('ja' as const, 'en' as const),
        }),
        (input) => {
          const parsed = signupRequestSchema.parse(input);
          const serialized = JSON.stringify(parsed);
          const reparsed = signupRequestSchema.parse(JSON.parse(serialized));
          expect(reparsed).toEqual(parsed);
        },
      ),
    );
  });
});
