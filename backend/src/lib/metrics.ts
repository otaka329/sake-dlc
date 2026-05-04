import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

/**
 * Powertools Metrics ラッパー
 * カスタムメトリクス送出（EMF 形式）
 */

export { MetricUnit };

export function createMetrics(serviceName: string, namespace = 'SDLC/Foundation'): Metrics {
  return new Metrics({
    namespace,
    serviceName,
  });
}
