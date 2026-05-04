import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * DynamoDB DocumentClient シングルトン
 * keepAlive: true（Node.js デフォルト）で接続再利用
 */

let docClient: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const client = new DynamoDBClient({});
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return docClient;
}

/**
 * テーブル名の環境変数マッピング
 */
export const TableNames = {
  users: () => process.env.USERS_TABLE || 'sdlc-users-dev',
  tasteProfiles: () => process.env.TASTE_PROFILES_TABLE || 'sdlc-taste-profiles-dev',
  drinkingLogs: () => process.env.DRINKING_LOGS_TABLE || 'sdlc-drinking-logs-dev',
  sakenowaCache: () => process.env.SAKENOWA_CACHE_TABLE || 'sdlc-sakenowa-cache-dev',
  appData: () => process.env.APP_DATA_TABLE || 'sdlc-app-data-dev',
} as const;
