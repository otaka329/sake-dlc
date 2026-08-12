import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlanProvider, usePlan } from '@/contexts/PlanContext';
import { ConditionCard } from '../components/ConditionCard';
import { ScheduleCard } from '../components/ScheduleCard';
import { DishCard } from '../components/DishCard';
import { MoodCard } from '../components/MoodCard';
import { DeployAdviceDisplay } from '../components/DeployAdviceDisplay';
import { useDontDeploy } from '../hooks/useDontDeploy';

/**
 * Plan 画面（/ ルート）
 * US-04: 体調・予定の入力、US-06: 料理の入力（テキスト）
 * カード式 UI: 任意順序、スキップ可
 */
function PlanPageContent() {
  const { t } = useTranslation('plan');
  const plan = usePlan();
  const { trigger } = useDontDeploy();

  // カード入力変更で自動判定（1秒デバウンス）
  useEffect(() => {
    trigger({
      conditionScore: plan.conditionScore,
      isMedicated: plan.isMedicated,
      sleepHours: plan.sleepHours ?? undefined,
      tomorrowScheduleImportance: plan.tomorrowScheduleImportance,
      tomorrowEarliestStart: plan.tomorrowEarliestStart || undefined,
      tomorrowScheduleSummary: plan.tomorrowScheduleSummary || undefined,
      dishes: plan.dishes.length > 0 ? plan.dishes : undefined,
      mood: plan.mood || undefined,
    });
  }, [
    plan.conditionScore, plan.isMedicated, plan.sleepHours,
    plan.tomorrowScheduleImportance, plan.tomorrowEarliestStart,
    plan.tomorrowScheduleSummary, plan.dishes, plan.mood, trigger,
  ]);

  return (
    <div data-testid="plan-page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{t('title')}</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>{t('subtitle')}</p>

      <ConditionCard />
      <ScheduleCard />
      <DishCard />
      <MoodCard />
      <DeployAdviceDisplay />
    </div>
  );
}

export function PlanPage() {
  return (
    <PlanProvider>
      <PlanPageContent />
    </PlanProvider>
  );
}
