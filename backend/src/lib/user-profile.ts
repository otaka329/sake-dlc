import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { DisclosureLevel } from '@sdlc/shared-types';
import { getDocClient, TableNames } from './dynamodb';

/**
 * ユーザーの locale と disclosureLevel を取得する共通ヘルパー
 * L1: ハンドラー3本で重複していた PROFILE 取得を DRY 化
 */
export interface UserProfileInfo {
  locale: string;
  disclosureLevel: DisclosureLevel;
}

export async function getUserProfileInfo(userId: string): Promise<UserProfileInfo> {
  const docClient = getDocClient();
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.users(),
      Key: { userId, entityType: 'PROFILE' },
      ProjectionExpression: 'disclosureLevel, locale',
    }),
  );

  return {
    locale: (result.Item?.locale as string) || 'ja',
    disclosureLevel: (result.Item?.disclosureLevel as DisclosureLevel) || 1,
  };
}
