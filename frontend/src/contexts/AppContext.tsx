import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * アプリケーション状態管理 Context
 * US-03: 言語設定、US-26: オフライン対応
 */

interface AppState {
  locale: 'ja' | 'en';
  isOffline: boolean;
  currentCycleStep: 'plan' | 'build' | 'test' | 'deploy' | 'monitor' | 'optimize';
}

type AppAction =
  | { type: 'SET_LOCALE'; payload: 'ja' | 'en' }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SET_CYCLE_STEP'; payload: AppState['currentCycleStep'] };

const initialState: AppState = {
  locale: 'ja',
  isOffline: false,
  currentCycleStep: 'plan',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOCALE':
      return { ...state, locale: action.payload };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    case 'SET_CYCLE_STEP':
      return { ...state, currentCycleStep: action.payload };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  setLocale: (locale: 'ja' | 'en') => void;
  setCycleStep: (step: AppState['currentCycleStep']) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { i18n } = useTranslation();

  // オフライン検出
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初期状態
    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setLocale = useCallback(
    (locale: 'ja' | 'en') => {
      i18n.changeLanguage(locale);
      localStorage.setItem('sdlc-locale', locale);
      dispatch({ type: 'SET_LOCALE', payload: locale });
    },
    [i18n],
  );

  const setCycleStep = useCallback((step: AppState['currentCycleStep']) => {
    dispatch({ type: 'SET_CYCLE_STEP', payload: step });
  }, []);

  return (
    <AppContext.Provider value={{ ...state, setLocale, setCycleStep }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp は AppProvider 内で使用してください');
  }
  return context;
}
