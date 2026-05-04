import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { DisclosureProvider, useDisclosure } from '../../src/contexts/DisclosureContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DisclosureProvider>{children}</DisclosureProvider>
);

describe('DisclosureContext', () => {
  it('初期状態は Layer 1、カテゴリなし', () => {
    const { result } = renderHook(() => useDisclosure(), { wrapper });
    expect(result.current.disclosureLevel).toBe(1);
    expect(result.current.unlockedCategories).toEqual([]);
  });

  it('isLayerVisible: Layer 1 は常に表示可能', () => {
    const { result } = renderHook(() => useDisclosure(), { wrapper });
    expect(result.current.isLayerVisible(1)).toBe(true);
    expect(result.current.isLayerVisible(2)).toBe(false);
    expect(result.current.isLayerVisible(3)).toBe(false);
  });

  it('unlockCategory: カテゴリを個別解放', () => {
    const { result } = renderHook(() => useDisclosure(), { wrapper });

    act(() => {
      result.current.unlockCategory('type');
    });

    expect(result.current.unlockedCategories).toContain('type');
    expect(result.current.isCategoryUnlocked('type')).toBe(true);
    expect(result.current.isCategoryUnlocked('region')).toBe(false);
  });

  it('unlockCategory: 重複解放は無視（冪等）', () => {
    const { result } = renderHook(() => useDisclosure(), { wrapper });

    act(() => {
      result.current.unlockCategory('type');
      result.current.unlockCategory('type');
    });

    expect(result.current.unlockedCategories).toEqual(['type']);
  });

  it('unlockAll: Layer 3 に全解放', () => {
    const { result } = renderHook(() => useDisclosure(), { wrapper });

    act(() => {
      result.current.unlockAll();
    });

    expect(result.current.disclosureLevel).toBe(3);
    expect(result.current.unlockedCategories).toEqual([]);
    expect(result.current.isLayerVisible(3)).toBe(true);
  });

  it('setDisclosure: サーバーから取得した状態を設定', () => {
    const { result } = renderHook(() => useDisclosure(), { wrapper });

    act(() => {
      result.current.setDisclosure(2, ['type', 'region']);
    });

    expect(result.current.disclosureLevel).toBe(2);
    expect(result.current.isLayerVisible(2)).toBe(true);
  });
});
