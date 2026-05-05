import { createHash } from 'crypto';
import { createLogger } from './logger';
import { createMetrics, MetricUnit } from './metrics';

const logger = createLogger('password-blocklist');
const metrics = createMetrics('password-blocklist');

/**
 * パスワードブロックリスト照合（サーバーサイド多層防御）
 * BR-01-07: HaveIBeenPwned + カスタム辞書 + コンテキスト固有チェック
 *
 * Unit 1 ではフロントエンド（SignupPage.tsx）のみで実施。
 * このモジュールは Unit 2 の Cognito SDK 統合時にサーバーサイド再検証
 * （Custom Auth Challenge または Pre Auth Trigger）で使用予定。
 *
 * パスワードは TLS 経由で受信し、メモリ上でのみ処理（保存・ログ記録しない）。
 */

const CUSTOM_DICTIONARY = [
  'sdlc', 'sake', 'sakenowa', 'nihonshu', 'password', 'qwerty',
  'letmein', 'welcome', 'admin', 'login',
];

const HIBP_API_TIMEOUT_MS = 2000;

/**
 * HaveIBeenPwned k-anonymity チェック
 * Fail-open: タイムアウト時はスキップ（可用性優先）
 */
async function checkHaveIBeenPwned(password: string): Promise<boolean> {
  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HIBP_API_TIMEOUT_MS);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SDLC-Signup-Lambda' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn('HaveIBeenPwned API エラー', { status: response.status });
      metrics.addMetric('HibpTimeoutCount', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
      return false; // Fail-open
    }

    const text = await response.text();
    return text.split('\n').some((line) => line.split(':')[0].trim() === suffix);
  } catch (err) {
    logger.warn('HaveIBeenPwned チェック失敗（スキップ）', { error: (err as Error).message });
    metrics.addMetric('HibpTimeoutCount', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();
    return false; // Fail-open
  }
}

/**
 * ブロックリスト照合（3段階）
 * @returns 拒否理由メッセージ（合格時は null）
 */
export async function checkBlocklist(password: string, email: string): Promise<string | null> {
  // 1. カスタム辞書チェック
  const lower = password.toLowerCase();
  for (const word of CUSTOM_DICTIONARY) {
    if (lower.includes(word)) {
      return `パスワードに「${word}」を含めることはできません。より安全なパスワードを選択してください。`;
    }
  }

  // 2. コンテキスト固有チェック
  const [localPart, domain] = email.toLowerCase().split('@');
  if (localPart && localPart.length >= 3 && lower.includes(localPart)) {
    return 'パスワードにメールアドレスの一部を含めることはできません。';
  }
  if (domain) {
    const domainName = domain.split('.')[0];
    if (domainName && domainName.length >= 3 && lower.includes(domainName)) {
      return 'パスワードにメールドメインの一部を含めることはできません。';
    }
  }

  // 3. HaveIBeenPwned チェック（Fail-open）
  const isPwned = await checkHaveIBeenPwned(password);
  if (isPwned) {
    return 'このパスワードは漏洩リストに含まれています。より安全なパスワードを選択してください。';
  }

  return null; // 合格
}
