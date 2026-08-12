import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { PlanProvider } from '../../../src/contexts/PlanContext';
import { AppProvider } from '../../../src/contexts/AppContext';
import { PlanPage } from '../../../src/features/plan/pages/PlanPage';

const renderPlanPage = () =>
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <AppProvider>
          <PlanProvider>
            <PlanPage />
          </PlanProvider>
        </AppProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );

describe('PlanPage', () => {
  it('4つのカードが表示される', () => {
    renderPlanPage();
    expect(screen.getByTestId('plan-condition-card')).toBeInTheDocument();
    expect(screen.getByTestId('plan-schedule-card')).toBeInTheDocument();
    expect(screen.getByTestId('plan-dish-card')).toBeInTheDocument();
    expect(screen.getByTestId('plan-mood-card')).toBeInTheDocument();
  });

  it('初期状態では DeployAdvice が表示されない', () => {
    renderPlanPage();
    expect(screen.queryByTestId('plan-deploy-advice')).not.toBeInTheDocument();
  });

  it('体調スコアスライダーが表示される', () => {
    renderPlanPage();
    expect(screen.getByTestId('plan-condition-score-slider')).toBeInTheDocument();
  });

  it('料理追加ボタンが表示される', () => {
    renderPlanPage();
    expect(screen.getByTestId('plan-dish-add-button')).toBeInTheDocument();
  });
});
