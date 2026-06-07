import { describe, it, expect } from 'vitest';
import { substituteVariables } from '../../../src/lib/ai-gateway/template-manager';

describe('TemplateManager - substituteVariables', () => {
  it('変数を正しく置換する', () => {
    const template = '料理: {{dishes}}、気分: {{mood}}';
    const result = substituteVariables(template, { dishes: '刺身', mood: '元気' });
    expect(result).toBe('料理: 刺身、気分: 元気');
  });

  it('オブジェクト値は JSON.stringify される', () => {
    const template = 'プロファイル: {{profile}}';
    const result = substituteVariables(template, { profile: { f1: 0.5, f2: 0.8 } });
    expect(result).toContain('"f1":0.5');
  });

  it('未置換プレースホルダーが残るとエラー（BR-13-05）', () => {
    const template = '{{dishes}} と {{unknown}}';
    expect(() => substituteVariables(template, { dishes: '焼き魚' })).toThrow('未置換変数');
  });

  it('ユーザー入力に {{}} が含まれてもエラーにならない（L1 サニタイズ）', () => {
    const template = '気分: {{mood}}';
    const result = substituteVariables(template, { mood: '{{inject}} テスト' });
    expect(result).toBe('気分: { {inject} } テスト');
    expect(result).not.toContain('{{');
  });

  it('全変数が置換されると正常完了', () => {
    const template = '{{a}} {{b}} {{c}}';
    const result = substituteVariables(template, { a: '1', b: '2', c: '3' });
    expect(result).toBe('1 2 3');
  });
});
