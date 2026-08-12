import { useTranslation } from 'react-i18next';
import { usePlan } from '@/contexts/PlanContext';

/**
 * 体調入力カード（US-04）
 * 体調スコア（5段階スライダー）、服薬チェックボックス、睡眠時間
 */
export function ConditionCard() {
  const { t } = useTranslation('plan');
  const { conditionScore, isMedicated, sleepHours, setCondition } = usePlan();

  return (
    <div data-testid="plan-condition-card" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>{t('condition.title')}</h3>

      <div style={{ marginBottom: '12px' }}>
        <label>{t('condition.score')}: {conditionScore}</label>
        <input
          data-testid="plan-condition-score-slider"
          type="range"
          min={1}
          max={5}
          value={conditionScore}
          onChange={(e) => setCondition({ conditionScore: parseInt(e.target.value, 10) })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            data-testid="plan-condition-medicated-checkbox"
            type="checkbox"
            checked={isMedicated}
            onChange={(e) => setCondition({ isMedicated: e.target.checked })}
          />
          {t('condition.medicated')}
        </label>
      </div>

      <div>
        <label>{t('condition.sleep')}</label>
        <input
          data-testid="plan-condition-sleep-input"
          type="number"
          min={0}
          max={24}
          value={sleepHours ?? ''}
          onChange={(e) => setCondition({ sleepHours: e.target.value ? parseFloat(e.target.value) : null })}
          placeholder="7"
          style={{ width: '80px', padding: '4px', marginLeft: '8px' }}
        />
        <span style={{ marginLeft: '4px' }}>{t('condition.hours')}</span>
      </div>
    </div>
  );
}
