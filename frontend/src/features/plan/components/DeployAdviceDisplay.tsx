import { useTranslation } from 'react-i18next';
import { usePlan } from '@/contexts/PlanContext';

/**
 * Deploy 判定結果表示（US-09）
 * Don't Deploy 判定結果をカード下部に表示
 */
export function DeployAdviceDisplay() {
  const { t } = useTranslation('plan');
  const { deployAdvice, isLoading } = usePlan();

  if (isLoading) {
    return (
      <div data-testid="plan-deploy-advice" style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
        {t('advice.loading')}
      </div>
    );
  }

  if (!deployAdvice) return null;

  const isDeploy = deployAdvice.decision === 'deploy';

  return (
    <div
      data-testid="plan-deploy-advice"
      style={{
        padding: '16px',
        backgroundColor: isDeploy ? '#d4edda' : '#fff3cd',
        borderRadius: '8px',
        border: `1px solid ${isDeploy ? '#c3e6cb' : '#ffc107'}`,
      }}
    >
      <p data-testid="plan-deploy-advice-decision" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {isDeploy ? '🍶 ' + t('advice.deploy') : '☕ ' + t('advice.skipDeploy')}
      </p>
      <p style={{ color: '#555', marginBottom: '8px' }}>{deployAdvice.reason}</p>

      {/* ノンアル代替提案 */}
      {!isDeploy && deployAdvice.alternatives && deployAdvice.alternatives.length > 0 && (
        <div data-testid="plan-alternatives-list" style={{ marginTop: '12px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{t('advice.alternatives')}</p>
          <ul style={{ paddingLeft: '20px' }}>
            {deployAdvice.alternatives.map((alt, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                <strong>{alt.name}</strong> — {alt.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
