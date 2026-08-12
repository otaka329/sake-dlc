import { useTranslation } from 'react-i18next';
import { usePlan } from '@/contexts/PlanContext';

/**
 * 翌日予定入力カード（US-04）
 * 重要度スライダー、開始時刻、概要テキスト
 */
export function ScheduleCard() {
  const { t } = useTranslation('plan');
  const { tomorrowScheduleImportance, tomorrowEarliestStart, tomorrowScheduleSummary, setSchedule } = usePlan();

  return (
    <div data-testid="plan-schedule-card" style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>{t('schedule.title')}</h3>

      <div style={{ marginBottom: '12px' }}>
        <label>{t('schedule.importance')}: {tomorrowScheduleImportance}</label>
        <input
          data-testid="plan-schedule-importance-slider"
          type="range"
          min={1}
          max={5}
          value={tomorrowScheduleImportance}
          onChange={(e) => setSchedule({ tomorrowScheduleImportance: parseInt(e.target.value, 10) })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label>{t('schedule.earliestStart')}</label>
        <input
          data-testid="plan-schedule-earliest-start-input"
          type="time"
          value={tomorrowEarliestStart}
          onChange={(e) => setSchedule({ tomorrowEarliestStart: e.target.value })}
          style={{ padding: '4px', marginLeft: '8px' }}
        />
      </div>

      <div>
        <label>{t('schedule.summary')}</label>
        <input
          data-testid="plan-schedule-summary-input"
          type="text"
          value={tomorrowScheduleSummary}
          onChange={(e) => setSchedule({ tomorrowScheduleSummary: e.target.value })}
          placeholder={t('schedule.summaryPlaceholder')}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '4px' }}
        />
      </div>
    </div>
  );
}
