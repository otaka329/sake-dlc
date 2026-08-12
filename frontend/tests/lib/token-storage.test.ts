import { describe, it, expect, beforeEach, vi } from 'vitest';

// jsdom 環境の localStorage をモック（Node 22 組み込み localStorage との干渉回避）
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

import { getTokens, setTokens, clearTokens } from '../../src/lib/token-storage';

describe('token-storage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
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
    mockLocalStorage.setItem('sdlc-tokens', 'invalid-json');
    expect(getTokens()).toBeNull();
  });
});
