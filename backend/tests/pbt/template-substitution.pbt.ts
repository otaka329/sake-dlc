import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { substituteVariables } from '../../src/lib/ai-gateway/template-manager';

/**
 * PBT: テンプレート変数置換
 * Invariant: 置換後に {{}} が残らない
 */
describe('PBT: テンプレート変数置換', () => {
  it('全変数が提供されれば {{}} が残らない', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('{') && !s.includes('}')),
        fc.string({ minLength: 1, maxLength: 50 }),
        (varName, varValue) => {
          const template = `テスト {{${varName}}} 終わり`;
          const result = substituteVariables(template, { [varName]: varValue });
          expect(result).not.toContain('{{');
          expect(result).not.toContain('}}');
        },
      ),
    );
  });

  it('ユーザー入力に {{}} が含まれても最終出力に {{}} が残らない', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        (userInput) => {
          const template = '入力: {{mood}}';
          const result = substituteVariables(template, { mood: userInput });
          expect(result).not.toMatch(/\{\{[^}]+\}\}/);
        },
      ),
    );
  });
});
