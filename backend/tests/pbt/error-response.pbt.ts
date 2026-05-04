import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  InternalError,
} from '../../src/lib/errors';

/**
 * PBT: エラーレスポンス構造（NFR Design §7）
 * PBT-03: Invariant — 全エラーが { code, message } 構造を持つ
 */

const errorFactories = [
  (msg: string) => new ValidationError(msg),
  (msg: string) => new AuthError(msg),
  (msg: string) => new ForbiddenError(msg),
  (msg: string) => new NotFoundError(msg),
  (msg: string) => new RateLimitError(msg),
  (msg: string) => new InternalError(msg),
];

describe('PBT: エラーレスポンス構造', () => {
  it('全エラーの toResponse() は code と message を持つ', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 0, max: errorFactories.length - 1 }),
        (message, factoryIndex) => {
          const err = errorFactories[factoryIndex](message);
          const response = err.toResponse();
          expect(response).toHaveProperty('code');
          expect(response).toHaveProperty('message');
          expect(typeof response.code).toBe('string');
          expect(typeof response.message).toBe('string');
          expect(response.code.length).toBeGreaterThan(0);
        },
      ),
    );
  });
});
