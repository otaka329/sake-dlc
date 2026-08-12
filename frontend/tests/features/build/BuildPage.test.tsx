import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { PlanProvider } from '../../../src/contexts/PlanContext';
import { AppProvider } from '../../../src/contexts/AppContext';
import { DisclosureProvider } from '../../../src/contexts/DisclosureContext';
import { BuildPage } from '../../../src/features/build/pages/BuildPage';

const renderBuildPage = () =>
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <AppProvider>
          <PlanProvider>
            <DisclosureProvider>
              <BuildPage />
            </DisclosureProvider>
          </PlanProvider>
        </AppProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );

describe('BuildPage', () => {
  it('推薦ボタンが表示される', () => {
    renderBuildPage();
    expect(screen.getByTestId('build-recommend-button')).toBeInTheDocument();
  });

  it('メタ質問ボタンが表示される', () => {
    renderBuildPage();
    expect(screen.getByTestId('build-meta-question-button')).toBeInTheDocument();
  });

  it('初期状態では推薦リストが表示されない', () => {
    renderBuildPage();
    expect(screen.queryByTestId('build-recommendation-list')).not.toBeInTheDocument();
  });

  it('初期状態ではエラーが表示されない', () => {
    renderBuildPage();
    expect(screen.queryByTestId('build-error')).not.toBeInTheDocument();
  });
});
