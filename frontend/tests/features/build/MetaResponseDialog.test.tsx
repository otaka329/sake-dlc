import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { MetaResponseDialog } from '../../../src/features/build/components/MetaResponseDialog';
import type { MetaResponse } from '@sdlc/shared-types';

const mockResponse: MetaResponse = {
  message: '一息ついてみましょう。白湯を一杯。',
  suggestedAction: 'pause',
  forceDeploy: false,
};

const renderDialog = (onDismiss = vi.fn()) =>
  render(
    <I18nextProvider i18n={i18n}>
      <MetaResponseDialog response={mockResponse} onDismiss={onDismiss} />
    </I18nextProvider>,
  );

describe('MetaResponseDialog', () => {
  it('メッセージが表示される', () => {
    renderDialog();
    expect(screen.getByTestId('build-meta-response-message')).toHaveTextContent('一息ついてみましょう');
  });

  it('閉じるボタンが表示される', () => {
    renderDialog();
    expect(screen.getByTestId('build-meta-response-dismiss')).toBeInTheDocument();
  });

  it('閉じるボタンクリックで onDismiss が呼ばれる', () => {
    const onDismiss = vi.fn();
    renderDialog(onDismiss);
    fireEvent.click(screen.getByTestId('build-meta-response-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('背景クリックで onDismiss が呼ばれる', () => {
    const onDismiss = vi.fn();
    renderDialog(onDismiss);
    fireEvent.click(screen.getByTestId('build-meta-response-dialog'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
