import { useTranslation } from 'react-i18next';
import { usePlan } from '@/contexts/PlanContext';

/**
 * 気分入力カード（US-04 補足）
 * 任意のテキスト入力
 */
export function MoodCard() {
  const { t } = useTranslation('plan');
  const { mood, setMood } = usePlan();

  return (
    <div data-testid="plan-mood-card" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>{t('mood.title')}</h3>
      <input
        data-testid="plan-mood-input"
        type="text"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        placeholder={t('mood.placeholder')}
        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />
    </div>
  );
}
