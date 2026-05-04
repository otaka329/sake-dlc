import type { ScheduledEvent, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createLogger } from '../../lib/logger';

const logger = createLogger('cognito-daily-backup');
const cognitoClient = new CognitoIdentityProviderClient({});
const s3Client = new S3Client({});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const BACKUP_BUCKET = process.env.BACKUP_BUCKET || '';

/**
 * Cognito 日次バックアップ Lambda
 * EventBridge スケジュールトリガー（毎日 03:00 JST）
 * ユーザー属性をエクスポートして S3 に保存
 * RPO: 24時間（Cognito User Pool）
 */
export const handler = async (
  _event: ScheduledEvent,
  _context: Context,
): Promise<void> => {
  logger.info('Cognito 日次バックアップ開始');

  try {
    const users: Record<string, unknown>[] = [];
    let paginationToken: string | undefined;

    // 全ユーザーを取得（ページネーション対応）
    do {
      const result = await cognitoClient.send(
        new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          PaginationToken: paginationToken,
          Limit: 60,
        }),
      );

      if (result.Users) {
        for (const user of result.Users) {
          const attributes: Record<string, string> = {};
          for (const attr of user.Attributes || []) {
            if (attr.Name && attr.Value) {
              attributes[attr.Name] = attr.Value;
            }
          }
          users.push({
            username: user.Username,
            status: user.UserStatus,
            enabled: user.Enabled,
            createdAt: user.UserCreateDate?.toISOString(),
            modifiedAt: user.UserLastModifiedDate?.toISOString(),
            attributes,
          });
        }
      }

      paginationToken = result.PaginationToken;
    } while (paginationToken);

    // S3 にエクスポート
    const date = new Date().toISOString().split('T')[0];
    const key = `cognito-backups/${date}/users.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BACKUP_BUCKET,
        Key: key,
        Body: JSON.stringify(users, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      }),
    );

    logger.info('Cognito 日次バックアップ完了', {
      userCount: users.length,
      s3Key: key,
    });
  } catch (err) {
    logger.error('Cognito 日次バックアップ失敗', err as Error);
    throw err; // DLQ に送信
  }
};
