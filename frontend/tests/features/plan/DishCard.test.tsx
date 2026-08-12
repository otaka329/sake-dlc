import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { PlanProvider } from '../../../src/contexts/PlanContext';
import { AppProvider } from '../../../src/contexts/AppContext';
import { DishCard } from '../../../src/features/plan/components/DishCard';

const renderDishCard = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <AppProvider>
        <PlanProvider>
          <DishCard />
        </PlanProvider>
      </AppProvider>
    </I18nextProvider>,
  );

describe('DishCard', () => {
  it('テキスト入力フィールドが表示される', () => {
    renderDishCard();
    expect(screen.getByTestId('plan-dish-input')).toBeInTheDocument();
  });

  it('追加ボタンが初期状態で無効', () => {
    renderDishCard();
    const addButton = screen.getByTestId('plan-dish-add-button');
    expect(addButton).toBeDisabled();
  });

  it('テキスト入力で追加ボタンが有効になる', () => {
    renderDishCard();
    const input = screen.getByTestId('plan-dish-input');
    fireEvent.change(input, { target: { value: '刺身' } });
    expect(screen.getByTestId('plan-dish-add-button')).not.toBeDisabled();
  });

  it('フォーカスでサジェストが表示される', () => {
    renderDishCard();
    const input = screen.getByTestId('plan-dish-input');
    fireEvent.focus(input);
    expect(screen.getByTestId('plan-dish-suggest-sashimi')).toBeInTheDocument();
  });
});
