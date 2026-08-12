import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PlanProvider, usePlan } from '../../src/contexts/PlanContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PlanProvider>{children}</PlanProvider>
);

describe('PlanContext', () => {
  it('初期状態が正しい', () => {
    const { result } = renderHook(() => usePlan(), { wrapper });
    expect(result.current.conditionScore).toBe(3);
    expect(result.current.isMedicated).toBe(false);
    expect(result.current.sleepHours).toBeNull();
    expect(result.current.dishes).toEqual([]);
    expect(result.current.mood).toBe('');
    expect(result.current.deployAdvice).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('setCondition で体調を更新できる', () => {
    const { result } = renderHook(() => usePlan(), { wrapper });
    act(() => { result.current.setCondition({ conditionScore: 5, isMedicated: true }); });
    expect(result.current.conditionScore).toBe(5);
    expect(result.current.isMedicated).toBe(true);
  });

  it('addDish / removeDish で料理を追加・削除できる', () => {
    const { result } = renderHook(() => usePlan(), { wrapper });
    act(() => { result.current.addDish({ name: '刺身', source: 'text' }); });
    expect(result.current.dishes).toHaveLength(1);
    expect(result.current.dishes[0].name).toBe('刺身');

    act(() => { result.current.removeDish(0); });
    expect(result.current.dishes).toHaveLength(0);
  });

  it('setLoading でローディング状態を制御できる', () => {
    const { result } = renderHook(() => usePlan(), { wrapper });
    act(() => { result.current.setLoading(true); });
    expect(result.current.isLoading).toBe(true);
    act(() => { result.current.setLoading(false); });
    expect(result.current.isLoading).toBe(false);
  });

  it('reset で初期状態に戻る', () => {
    const { result } = renderHook(() => usePlan(), { wrapper });
    act(() => {
      result.current.setCondition({ conditionScore: 1 });
      result.current.setMood('疲れた');
      result.current.addDish({ name: 'テスト', source: 'text' });
    });
    act(() => { result.current.reset(); });
    expect(result.current.conditionScore).toBe(3);
    expect(result.current.mood).toBe('');
    expect(result.current.dishes).toEqual([]);
  });
});
