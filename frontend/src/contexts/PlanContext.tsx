import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { DishInput, DeployAdvice } from '@sdlc/shared-types';

/**
 * Plan 画面の状態管理 Context
 * US-04: 体調・予定の入力、US-06: 料理の入力（テキスト）
 */

export interface PlanState {
  conditionScore: number;
  isMedicated: boolean;
  sleepHours: number | null;
  tomorrowScheduleImportance: number;
  tomorrowEarliestStart: string;
  tomorrowScheduleSummary: string;
  dishes: DishInput[];
  mood: string;
  deployAdvice: DeployAdvice | null;
  isLoading: boolean;
}

type PlanAction =
  | { type: 'SET_CONDITION'; payload: Partial<Pick<PlanState, 'conditionScore' | 'isMedicated' | 'sleepHours'>> }
  | { type: 'SET_SCHEDULE'; payload: Partial<Pick<PlanState, 'tomorrowScheduleImportance' | 'tomorrowEarliestStart' | 'tomorrowScheduleSummary'>> }
  | { type: 'ADD_DISH'; payload: DishInput }
  | { type: 'REMOVE_DISH'; payload: number }
  | { type: 'SET_MOOD'; payload: string }
  | { type: 'SET_DEPLOY_ADVICE'; payload: DeployAdvice }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };

const initialState: PlanState = {
  conditionScore: 3,
  isMedicated: false,
  sleepHours: null,
  tomorrowScheduleImportance: 3,
  tomorrowEarliestStart: '',
  tomorrowScheduleSummary: '',
  dishes: [],
  mood: '',
  deployAdvice: null,
  isLoading: false,
};

function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'SET_CONDITION':
      return { ...state, ...action.payload };
    case 'SET_SCHEDULE':
      return { ...state, ...action.payload };
    case 'ADD_DISH':
      return { ...state, dishes: [...state.dishes, action.payload] };
    case 'REMOVE_DISH':
      return { ...state, dishes: state.dishes.filter((_, i) => i !== action.payload) };
    case 'SET_MOOD':
      return { ...state, mood: action.payload };
    case 'SET_DEPLOY_ADVICE':
      return { ...state, deployAdvice: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface PlanContextValue extends PlanState {
  setCondition: (payload: Partial<Pick<PlanState, 'conditionScore' | 'isMedicated' | 'sleepHours'>>) => void;
  setSchedule: (payload: Partial<Pick<PlanState, 'tomorrowScheduleImportance' | 'tomorrowEarliestStart' | 'tomorrowScheduleSummary'>>) => void;
  addDish: (dish: DishInput) => void;
  removeDish: (index: number) => void;
  setMood: (mood: string) => void;
  setDeployAdvice: (advice: DeployAdvice) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(planReducer, initialState);

  const setCondition = useCallback((payload: Partial<Pick<PlanState, 'conditionScore' | 'isMedicated' | 'sleepHours'>>) => {
    dispatch({ type: 'SET_CONDITION', payload });
  }, []);

  const setSchedule = useCallback((payload: Partial<Pick<PlanState, 'tomorrowScheduleImportance' | 'tomorrowEarliestStart' | 'tomorrowScheduleSummary'>>) => {
    dispatch({ type: 'SET_SCHEDULE', payload });
  }, []);

  const addDish = useCallback((dish: DishInput) => {
    dispatch({ type: 'ADD_DISH', payload: dish });
  }, []);

  const removeDish = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_DISH', payload: index });
  }, []);

  const setMood = useCallback((mood: string) => {
    dispatch({ type: 'SET_MOOD', payload: mood });
  }, []);

  const setDeployAdvice = useCallback((advice: DeployAdvice) => {
    dispatch({ type: 'SET_DEPLOY_ADVICE', payload: advice });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <PlanContext.Provider value={{ ...state, setCondition, setSchedule, addDish, removeDish, setMood, setDeployAdvice, setLoading, reset }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan は PlanProvider 内で使用してください');
  }
  return context;
}
