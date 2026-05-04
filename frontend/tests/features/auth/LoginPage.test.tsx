import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { LoginPage } from '../../../src/features/auth/pages/LoginPage';

const renderLoginPage = () =>
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  it('ログインフォームが表示される', () => {
    renderLoginPage();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-submit-button')).toBeInTheDocument();
  });

  it('ソーシャルログインボタンが表示される', () => {
    renderLoginPage();
    expect(screen.getByTestId('login-form-google-button')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-apple-button')).toBeInTheDocument();
  });

  it('サインアップリンクが表示される', () => {
    renderLoginPage();
    expect(screen.getByTestId('login-form-signup-link')).toBeInTheDocument();
  });

  it('パスワード表示/非表示トグルが機能する', () => {
    renderLoginPage();
    const passwordInput = screen.getByTestId('login-form-password-input');
    const toggleButton = screen.getByTestId('login-form-toggle-password');

    expect(passwordInput).toHaveAttribute('type', 'password');
    toggleButton.click();
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
