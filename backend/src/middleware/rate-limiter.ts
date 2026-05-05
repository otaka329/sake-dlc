import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { Logger } from '@aws-lambda-powertools/logger';
import { getDocClient, TableNames } from '../lib/dynamodb';
import { RateLimitError } from '../lib/errors';

/**
 * ユーザーレベルレート制限（スライディングウィンドウ）
 *
 * 実装方式: 直近 N 秒間のリクエストタイムスタンプを DynamoDB に記録し、
 * ウィンドウ内のカウントが上限を超えた場合に拒否。
 *
 * DynamoDB スキーマ:
 *   PK: userId, SK: RATELIMIT#{timestamp_ms}
 *   TTL: ttl（ウィンドウ + バッファ後に自動削除）
 *
 * SECURITY-11: レート制限
 */

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_TTL_BUFFER_SECONDS = 60;

/**
 * スライディングウィンドウ レート制限チェック
 *
 * 1. 直近60秒間のリクエスト数を Query で取得
 * 2. 上限以上なら RateLimitError をスロー
 * 3. 上限未満なら新しいタイムスタンプを PutItem で記録
 */
export async function checkRateLimit(userId: string, logger: Logger): Promise<void> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;
  const ttlValue = Math.floor(now / 1000) + RATE_LIMIT_WINDOW_SECONDS + RATE_LIMIT_TTL_BUFFER_SECONDS;

  const docClient = getDocClient();

  try {
    // 直近ウィンドウ内のリクエスト数を取得
    const result = await docClient.send(
      new QueryCommand({
        TableName: TableNames.appData(),
        KeyConditionExpression: '#pk = :pk AND #sk BETWEEN :skStart AND :skEnd',
        ExpressionAttributeNames: {
          '#pk': 'userId',
          '#sk': 'dataType',
        },
        ExpressionAttributeValues: {
          ':pk': userId,
          ':skStart': `RATELIMIT#${windowStart}`,
          ':skEnd': `RATELIMIT#${now}`,
        },
        Select: 'COUNT',
      }),
    );

    const currentCount = result.Count || 0;

    if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
      logger.warn('レート制限超過', { userId, currentCount, window: RATE_LIMIT_WINDOW_SECONDS });
      throw new RateLimitError();
    }

    // 新しいリクエストタイムスタンプを記録
    await docClient.send(
      new PutCommand({
        TableName: TableNames.appData(),
        Item: {
          userId,
          dataType: `RATELIMIT#${now}`,
          ttl: ttlValue,
        },
      }),
    );
  } catch (err) {
    if (err instanceof RateLimitError) {
      throw err;
    }
    // DynamoDB エラーはレート制限をスキップ（可用性優先、設計書に明記済み）
    logger.error('レート制限チェック失敗（スキップ）', err as Error);
  }
}
