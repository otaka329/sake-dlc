import { Logger } from '@aws-lambda-powertools/logger';

/**
 * Powertools Logger ラッパー
 * SECURITY-03: 構造化ログ、PII マスク設定
 */

// PII マスクキー一覧
const PII_KEYS = ['password', 'email', 'accessToken', 'idToken', 'refreshToken', 'mfaSecret', 'recoveryCode'];

/**
 * PII を含むオブジェクトをマスクする
 * email → ***@domain、その他 → [REDACTED]
 */
export function maskPii(obj: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.some((piiKey) => key.toLowerCase().includes(piiKey.toLowerCase()))) {
      if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
        const domain = value.split('@')[1];
        masked[key] = `***@${domain}`;
      } else {
        masked[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskPii(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

/**
 * サービス名付き Logger インスタンスを生成
 */
export function createLogger(serviceName: string): Logger {
  return new Logger({
    serviceName,
    logLevel: (process.env.LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') || 'INFO',
  });
}
