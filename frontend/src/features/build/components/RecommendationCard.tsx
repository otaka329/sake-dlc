import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recommendation } from '@sdlc/shared-types';
import { useDisclosure } from '@/contexts/DisclosureContext';

/**
 * 推薦結果カード（Layer 別表示 + カスタマイズ UI）
 * US-08: AI日本酒推薦、US-11: 推薦結果のカスタマイズ
 */

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const { t } = useTranslation('build');
  const { disclosureLevel } = useDisclosure();
  const [customTemp, setCustomTemp] = useState(recommendation.temperature.type);
  const [customAmount, setCustomAmount] = useState(recommendation.amount);

  return (
    <div
      data-testid={`build-recommendation-card-${index}`}
      style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px' }}
    >
      {/* 銘柄名 + matchScore */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '18px', margin: 0 }}>{recommendation.brandName}</h4>
        <span style={{ color: '#666', fontSize: '14px' }}>
          {t('card.matchScore')}: {Math.round(recommendation.matchScore * 100)}%
        </span>
      </div>

      {/* Layer 1: 感覚モード — 温度ラベル + 適量 + 理由 */}
      <p style={{ marginBottom: '8px' }}>
        {recommendation.temperature.label} / {recommendation.amount}ml / {recommendation.vessel}
      </p>
      <p style={{ color: '#555', marginBottom: '12px' }}>{recommendation.reason}</p>

      {/* Layer 2+: カテゴリ情報（将来: 純米/吟醸、産地を AI 出力に追加時に表示） */}
      {disclosureLevel >= 2 && recommendation.flavorScores && (
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
          <span>{t('card.flavor')}: </span>
          華 {recommendation.flavorScores.f1.toFixed(1)} /
          芳 {recommendation.flavorScores.f2.toFixed(1)} /
          重 {recommendation.flavorScores.f3.toFixed(1)} /
          穏 {recommendation.flavorScores.f4.toFixed(1)} /
          D {recommendation.flavorScores.f5.toFixed(1)} /
          軽 {recommendation.flavorScores.f6.toFixed(1)}
        </div>
      )}

      {/* カスタマイズ UI（US-11）*/}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
        <div>
          <label style={{ fontSize: '12px' }}>{t('card.temperature')}</label>
          <select
            data-testid={`build-recommendation-temperature-select-${index}`}
            value={customTemp}
            onChange={(e) => setCustomTemp(e.target.value as typeof customTemp)}
            style={{ display: 'block', padding: '4px', marginTop: '2px' }}
          >
            <option value="reishu">{t('temp.reishu')}</option>
            <option value="jouon">{t('temp.jouon')}</option>
            <option value="nurukan">{t('temp.nurukan')}</option>
            <option value="atsukan">{t('temp.atsukan')}</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px' }}>{t('card.amount')}: {customAmount}ml</label>
          <input
            data-testid={`build-recommendation-amount-slider-${index}`}
            type="range"
            min={30}
            max={300}
            step={10}
            value={customAmount}
            onChange={(e) => setCustomAmount(parseInt(e.target.value, 10))}
            style={{ display: 'block', marginTop: '2px' }}
          />
        </div>
      </div>
    </div>
  );
}
