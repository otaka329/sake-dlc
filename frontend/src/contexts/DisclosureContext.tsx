import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { DisclosureLevel, UnlockCategory } from '@sdlc/shared-types';
import {
  isLayerVisible as checkLayerVisible,
  isCategoryUnlocked as checkCategoryUnlocked,
} from '@sdlc/shared-types';

/**
 * 開示レイヤー管理 Context
 * US-29: 開示レイヤーに応じた表示切替
 * BR-07: Progressive Disclosure ビジネスルール
 */

interface DisclosureState {
  disclosureLevel: DisclosureLevel;
  unlockedCategories: UnlockCategory[];
}

type DisclosureAction =
  | { type: 'SET_DISCLOSURE'; payload: { disclosureLevel: DisclosureLevel; unlockedCategories: UnlockCategory[] } }
  | { type: 'UNLOCK_CATEGORY'; payload: UnlockCategory }
  | { type: 'UNLOCK_ALL' };

const initialState: DisclosureState = {
  disclosureLevel: 1,
  unlockedCategories: [],
};

function disclosureReducer(state: DisclosureState, action: DisclosureAction): DisclosureState {
  switch (action.type) {
    case 'SET_DISCLOSURE':
      return {
        disclosureLevel: action.payload.disclosureLevel,
        unlockedCategories: action.payload.unlockedCategories,
      };
    case 'UNLOCK_CATEGORY':
      if (state.disclosureLevel >= 2) return state; // Layer 2 以上なら個別解放不要
      if (state.unlockedCategories.includes(action.payload)) return state; // 既に解放済み
      return {
        ...state,
        unlockedCategories: [...state.unlockedCategories, action.payload],
      };
    case 'UNLOCK_ALL':
      return { disclosureLevel: 3, unlockedCategories: [] };
    default:
      return state;
  }
}

interface DisclosureContextValue extends DisclosureState {
  /** 指定レイヤーが表示可能か */
  isLayerVisible: (requiredLayer: DisclosureLevel) => boolean;
  /** 指定カテゴリが解放済みか */
  isCategoryUnlocked: (category: UnlockCategory) => boolean;
  /** サーバーから取得した開示状態を設定 */
  setDisclosure: (level: DisclosureLevel, categories: UnlockCategory[]) => void;
  /** カテゴリを個別解放（API 呼び出しは呼び出し元で実施） */
  unlockCategory: (category: UnlockCategory) => void;
  /** 全解放（API 呼び出しは呼び出し元で実施） */
  unlockAll: () => void;
}

const DisclosureContext = createContext<DisclosureContextValue | null>(null);

export function DisclosureProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(disclosureReducer, initialState);

  const isLayerVisible = useCallback(
    (requiredLayer: DisclosureLevel) => checkLayerVisible(state, requiredLayer),
    [state],
  );

  const isCategoryUnlocked = useCallback(
    (category: UnlockCategory) => checkCategoryUnlocked(state, category),
    [state],
  );

  const setDisclosure = useCallback(
    (level: DisclosureLevel, categories: UnlockCategory[]) => {
      dispatch({ type: 'SET_DISCLOSURE', payload: { disclosureLevel: level, unlockedCategories: categories } });
    },
    [],
  );

  const unlockCategory = useCallback((category: UnlockCategory) => {
    dispatch({ type: 'UNLOCK_CATEGORY', payload: category });
  }, []);

  const unlockAll = useCallback(() => {
    dispatch({ type: 'UNLOCK_ALL' });
  }, []);

  return (
    <DisclosureContext.Provider
      value={{ ...state, isLayerVisible, isCategoryUnlocked, setDisclosure, unlockCategory, unlockAll }}
    >
      {children}
    </DisclosureContext.Provider>
  );
}

export function useDisclosure(): DisclosureContextValue {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error('useDisclosure は DisclosureProvider 内で使用してください');
  }
  return context;
}
