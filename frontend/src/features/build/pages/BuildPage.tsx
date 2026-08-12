import { useTranslation } from 'react-i18next';
import { usePlan } from '@/contexts/PlanContext';
import { useRecommend } from '../hooks/useRecommend';
import { useMetaResponse } from '../hooks/useMetaResponse';
import { RecommendationList } from '../components/RecommendationList';
import { MetaResponseDialog } from '../components/MetaResponseDialog';
import { LoadingSpinner } from '@/features/shared/components/LoadingSpinner';

/**
 * Build 画面（/build ルート）
 * US-08: AI推薦実行 + 結果表示 + カスタマイズ
 * US-16: メタ応答
 */
export function BuildPage() {
  const { t } = useTranslation('build');
  const plan = usePlan();
  const { data: recommendations, isLoading, error, recommend } = useRecommend();
  const { data: metaResponse, isLoading: metaLoading, askMeta, dismiss } = useMetaResponse();

  const handleRecommend = () => {
    recommend({
      conditionScore: plan.conditionScore,
      isMedicated: plan.isMedicated,
      sleepHours: plan.sleepHours ?? undefined,
      tomorrowScheduleImportance: plan.tomorrowScheduleImportance,
      tomorrowEarliestStart: plan.tomorrowEarliestStart || undefined,
      dishes: plan.dishes.length > 0 ? plan.dishes : undefined,
      mood: plan.mood || undefined,
    });
  };

  const handleMetaQuestion = () => {
    askMeta('飲むべき？');
  };

  return (
    <div data-testid="build-page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{t('title')}</h1>

      {/* 推薦実行ボタン */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          data-testid="build-recommend-button"
          onClick={handleRecommend}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {isLoading ? t('loading') : t('recommend')}
        </button>

        <button
          data-testid="build-meta-question-button"
          onClick={handleMetaQuestion}
          disabled={metaLoading}
          style={{
            padding: '12px 16px',
            backgroundColor: '#fff',
            color: '#1a1a2e',
            border: '1px solid #1a1a2e',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {t('metaQuestion')}
        </button>
      </div>

      {/* ローディング */}
      {isLoading && <LoadingSpinner message={t('loading')} />}

      {/* エラー */}
      {error && (
        <div data-testid="build-error" role="alert" style={{ padding: '12px', backgroundColor: '#f8d7da', borderRadius: '8px', color: '#721c24', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* 推薦結果リスト */}
      {recommendations && (
        <RecommendationList recommendations={recommendations.recommendations} />
      )}

      {/* メタ応答ダイアログ */}
      {metaResponse && (
        <MetaResponseDialog response={metaResponse} onDismiss={dismiss} />
      )}
    </div>
  );
}
