import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import type { Logger } from '@aws-lambda-powertools/logger';
import { getDocClient, TableNames } from '../lib/dynamodb';
import { RateLimitError } from '../lib/errors';

/**
 * ユーザーレベルレート制限
 *
 * DynamoDB アトミック演算（ADD + ConditionExpression）でカウンター更新
 * 固定ウィンドウ: 60秒、上限: 100 req/min
 *
 * SECURITY-11: レート制限
 */

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_TTL_BUFFER_SECONDS = 60; // ウィンドウ + バッファ

/**
 * レート制限チェック
 * ConditionalCheckFailedException → 429 返却
 */
export async function checkRateLimit(userId: string, logger: Logger): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const windowId = Math.floor(now / RATE_LIMIT_WINDOW_SECONDS);
  const ttlValue = now + RATE_LIMIT_WINDOW_SECONDS + RATE_LIMIT_TTL_BUFFER_SECONDS;

  const docClient = getDocClient();

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TableNames.appData(),
        Key: {
          userId,
          dataType: `RATELIMIT#${windowId}`,
        },
        UpdateExpression:
          'ADD requestCount :inc SET #ttl = if_not_exists(#ttl, :ttlVal)',
        ConditionExpression:
          'attribute_not_exists(requestCount) OR requestCount < :limit',
        ExpressionAttributeNames: {
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':limit': RATE_LIMIT_MAX_REQUESTS,
          ':ttlVal': ttlValue,
        },
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      logger.warn('レート制限超過', { userId, windowId });
      throw new RateLimitError();
    }
    // DynamoDB エラーはレート制限をスキップ（可用性優先）
    logger.error('レート制限チェック失敗（スキップ）', err as Error);
  }
}
