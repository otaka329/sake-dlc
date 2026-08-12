import { describe, it, expect } from 'vitest';
import { isMetaQuestion } from '../../src/services/meta-response-service';

describe('MetaResponseService - isMetaQuestion', () => {
  it('「飲むべき？」→ true', () => {
    expect(isMetaQuestion('飲むべき？')).toBe(true);
  });

  it('「今日いける？」→ true', () => {
    expect(isMetaQuestion('今日いける？')).toBe(true);
  });

  it('「飲んでいい？」→ true', () => {
    expect(isMetaQuestion('飲んでいい？')).toBe(true);
  });

  it('「大丈夫？」→ true', () => {
    expect(isMetaQuestion('大丈夫？')).toBe(true);
  });

  it('英語: "should i drink" → true', () => {
    expect(isMetaQuestion('Should I drink tonight?')).toBe(true);
  });

  it('英語: "can i drink" → true', () => {
    expect(isMetaQuestion('Can I drink?')).toBe(true);
  });

  it('通常の料理入力 → false', () => {
    expect(isMetaQuestion('金目鯛の煮付け')).toBe(false);
  });

  it('空文字 → false', () => {
    expect(isMetaQuestion('')).toBe(false);
  });
});
