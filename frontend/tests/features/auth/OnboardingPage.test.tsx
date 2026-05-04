import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { OnboardingPage } from '../../../src/features/auth/pages/OnboardingPage';

const renderOnboardingPage = () =>
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <OnboardingPage />
      </I18nextProvider>
    </MemoryRouter>,
  );

describe('OnboardingPage', () => {
  it('オンボーディングフォームが表示される', () => {
    renderOnboardingPage();
    expect(screen.getByTestId('onboarding-form')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-form-nickname-input')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-form-locale-select')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-form-submit-button')).toBeInTheDocument();
  });

  it('経験レベル選択肢が4つ表示される（beginner, intermediate, advanced, skip）', () => {
    renderOnboardingPage();
    expect(screen.getByTestId('onboarding-form-experience-beginner')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-form-experience-intermediate')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-form-experience-advanced')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-form-experience-skip')).toBeInTheDocument();
  });

  it('経験レベルはラジオボタンで選択する', () => {
    renderOnboardingPage();
    const beginner = screen.getByTestId('onboarding-form-experience-beginner');
    expect(beginner).toHaveAttribute('type', 'radio');
  });
});
