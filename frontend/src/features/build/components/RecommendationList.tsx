import { useTranslation } from 'react-i18next';
import type { Recommendation } from '@sdlc/shared-types';
import { RecommendationCard } from './RecommendationCard';

/**
 * 推薦結果リスト
 */
interface RecommendationListProps {
  recommendations: Recommendation[];
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  const { t } = useTranslation('build');

  if (recommendations.length === 0) return null;

  return (
    <div data-testid="build-recommendation-list">
      <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>{t('list.title')}</h3>
      {recommendations.map((rec, index) => (
        <RecommendationCard key={rec.brandId} recommendation={rec} index={index} />
      ))}
      <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
        {t('list.attribution')}
      </p>
    </div>
  );
}
