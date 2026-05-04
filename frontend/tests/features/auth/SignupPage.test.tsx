import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { SignupPage } from '../../../src/features/auth/pages/SignupPage';

const renderSignupPage = () =>
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <SignupPage />
      </I18nextProvider>
    </MemoryRouter>,
  );

describe('SignupPage', () => {
  it('サインアップフォームが表示される', () => {
    renderSignupPage();
    expect(screen.getByTestId('signup-form')).toBeInTheDocument();
    expect(screen.getByTestId('signup-form-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-form-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-form-confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-form-submit-button')).toBeInTheDocument();
  });

  it('ログインリンクが表示される', () => {
    renderSignupPage();
    expect(screen.getByTestId('signup-form-login-link')).toBeInTheDocument();
  });

  it('パスワード表示チェックボックスが表示される', () => {
    renderSignupPage();
    expect(screen.getByTestId('signup-form-show-password')).toBeInTheDocument();
  });
});
