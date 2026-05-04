import { Tracer } from '@aws-lambda-powertools/tracer';

/**
 * Powertools Tracer ラッパー
 * X-Ray トレーシング、AWS SDK 自動計装
 */
export function createTracer(serviceName: string): Tracer {
  return new Tracer({
    serviceName,
  });
}
