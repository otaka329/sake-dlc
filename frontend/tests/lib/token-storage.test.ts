import { describe, it, expect, vi } from 'vitest';

// ky のモックは複雑なため、token-storage のロジックをテスト
import { getTokens, setTokens, clearTokens } from '../../src/lib/token-storage';

describe('token-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setTokens → getTokens でトークンを保存・取得できる', () => {
    const tokens = {
      accessToken: 'at-123',
      idToken: 'it-123',
      refreshToken: 'rt-123',
      expiresAt: '2026-12-31T00:00:00Z',
    };

    setTokens(tokens);
    const retrieved = getTokens();

    expect(retrieved).toEqual(tokens);
  });

  it('clearTokens でトークンが削除される', () => {
    setTokens({
      accessToken: 'at',
      idToken: 'it',
      refreshToken: 'rt',
      expiresAt: '2026-12-31T00:00:00Z',
    });

    clearTokens();
    expect(getTokens()).toBeNull();
  });

  it('トークン未保存時は null を返す', () => {
    expect(getTokens()).toBeNull();
  });

  it('不正な JSON が保存されている場合は null を返す', () => {
    localStorage.setItem('sdlc-tokens', 'invalid-json');
    expect(getTokens()).toBeNull();
  });
});
