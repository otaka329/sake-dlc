import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  it('初期状態は未認証', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login() で認証状態になる', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(
        {
          userId: 'test-id',
          email: 'test@example.com',
          nickname: 'テスト',
          locale: 'ja',
          sakeExperience: null,
          authProvider: 'email',
          disclosureLevel: 1,
          unlockedCategories: [],
          googleCalendarLinked: false,
          notificationEnabled: true,
          mfaEnabled: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          accessToken: 'at',
          idToken: 'it',
          refreshToken: 'rt',
          expiresAt: '2026-12-31T00:00:00Z',
        },
      );
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.nickname).toBe('テスト');
  });

  it('logout() で未認証状態に戻る', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(
        { userId: 'id', email: 'e', nickname: 'n', locale: 'ja', sakeExperience: null, authProvider: 'email', disclosureLevel: 1, unlockedCategories: [], googleCalendarLinked: false, notificationEnabled: true, mfaEnabled: false, createdAt: '', updatedAt: '' },
        { accessToken: 'at', idToken: 'it', refreshToken: 'rt', expiresAt: '2026-12-31T00:00:00Z' },
      );
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
