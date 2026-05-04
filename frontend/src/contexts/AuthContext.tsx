import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { UserResponse } from '@sdlc/shared-types';
import { getTokens, setTokens, clearTokens } from '../lib/token-storage';

/**
 * 認証状態管理 Context
 * US-01, US-02: ログイン・登録後のセッション管理
 */

interface UserSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserResponse | null;
  tokens: UserSession | null;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserResponse; tokens: UserSession } }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { tokens: UserSession } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserResponse> }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  tokens: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        tokens: action.payload.tokens,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'TOKEN_REFRESH':
      return { ...state, tokens: action.payload.tokens };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (user: UserResponse, tokens: UserSession) => void;
  logout: () => void;
  refreshTokens: (tokens: UserSession) => void;
  updateProfile: (updates: Partial<UserResponse>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 起動時にローカルストレージからトークンを復元
  useEffect(() => {
    const tokens = getTokens();
    if (tokens && new Date(tokens.expiresAt) > new Date()) {
      // TODO: Cognito SDK 統合時（Unit 2 相当）に、ここで以下を実施:
      // 1. アクセストークンでプロファイル API を呼び出し（GET /profile）
      // 2. 成功 → dispatch({ type: 'LOGIN_SUCCESS', payload: { user, tokens } })
      // 3. 失敗（401）→ refreshToken で更新試行 → 再失敗なら clearTokens() + LOGOUT
      // 現状はトークンの有効性のみ確認し、isAuthenticated は false のまま
      dispatch({ type: 'SET_LOADING', payload: false });
    } else {
      clearTokens();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback((user: UserResponse, tokens: UserSession) => {
    setTokens(tokens);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, tokens } });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshTokens = useCallback((tokens: UserSession) => {
    setTokens(tokens);
    dispatch({ type: 'TOKEN_REFRESH', payload: { tokens } });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserResponse>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshTokens, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
}
