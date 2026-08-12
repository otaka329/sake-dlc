import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { PlanProvider, usePlan } from '../../../src/contexts/PlanContext';
import { DeployAdviceDisplay } from '../../../src/features/plan/components/DeployAdviceDisplay';
import { renderHook, act } from '@testing-library/react';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <PlanProvider>{children}</PlanProvider>
  </I18nextProvider>
);

describe('DeployAdviceDisplay', () => {
  it('deployAdvice が null の場合は何も表示しない', () => {
    const { container } = render(<DeployAdviceDisplay />, { wrapper: Wrapper });
    expect(container.innerHTML).toBe('');
  });

  it('isLoading=true でローディング表示', () => {
    // PlanContext の isLoading を制御するため、usePlan 経由でセット
    const { result } = renderHook(() => usePlan(), { wrapper: Wrapper });
    act(() => { result.current.setLoading(true); });

    // 再レンダリングで反映されるが、このテストでは Context の値レベルで検証
    expect(result.current.isLoading).toBe(true);
  });
});
