import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../src/i18n/config';
import { DisclosureProvider } from '../../../src/contexts/DisclosureContext';
import { RecommendationCard } from '../../../src/features/build/components/RecommendationCard';
import type { Recommendation } from '@sdlc/shared-types';

const mockRecommendation: Recommendation = {
  brandId: 1,
  brandName: '獺祭',
  temperature: { type: 'reishu', celsius: 10, label: '冷やして', labelEn: 'chilled' },
  amount: 90,
  vessel: 'ワイングラス',
  reason: 'テスト理由テスト理由',
  flavorScores: { f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.4, f5: 0.5, f6: 0.7 },
  matchScore: 0.92,
};

const renderCard = (rec = mockRecommendation, index = 0) =>
  render(
    <I18nextProvider i18n={i18n}>
      <DisclosureProvider>
        <RecommendationCard recommendation={rec} index={index} />
      </DisclosureProvider>
    </I18nextProvider>,
  );

describe('RecommendationCard', () => {
  it('銘柄名が表示される', () => {
    renderCard();
    expect(screen.getByText('獺祭')).toBeInTheDocument();
  });

  it('matchScore がパーセント表示される', () => {
    renderCard();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it('温度帯セレクトが表示される', () => {
    renderCard();
    expect(screen.getByTestId('build-recommendation-temperature-select-0')).toBeInTheDocument();
  });

  it('適量スライダーが表示される', () => {
    renderCard();
    expect(screen.getByTestId('build-recommendation-amount-slider-0')).toBeInTheDocument();
  });

  it('Layer 1（デフォルト）ではフレーバースコアが表示されない', () => {
    renderCard();
    // DisclosureProvider デフォルトは disclosureLevel=1
    expect(screen.queryByText(/華/)).not.toBeInTheDocument();
  });
});
