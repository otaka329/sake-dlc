import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { randomBytes } from 'crypto';
import { KMSClient, GenerateMacCommand } from '@aws-sdk/client-kms';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { success } from '../../lib/response';

const kmsClient = new KMSClient({});

/**
 * POST /mfa/recovery-codes — リカバリーコード発行
 * US-02B: MFA（多要素認証）設定
 * BR-02B-05: リカバリーコード10個を発行
 * BR-02B-06: HMAC-SHA-256（KMS 鍵管理）でハッシュ化して保存
 */

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 8; // 64ビット以上のランダム値
const KMS_KEY_ID = process.env.KMS_RECOVERY_CODES_KEY_ID || '';

/**
 * リカバリーコードを生成（平文）
 * 各コードは 64ビット以上のランダム値を16進数で表現
 */
function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    randomBytes(RECOVERY_CODE_BYTES).toString('hex'),
  );
}

/**
 * リカバリーコードを HMAC-SHA-256 でハッシュ化（並列実行）
 * KMS 鍵を使用（鍵管理を AWS に委譲）
 */
async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  const promises = codes.map(async (code) => {
    const result = await kmsClient.send(
      new GenerateMacCommand({
        KeyId: KMS_KEY_ID,
        MacAlgorithm: 'HMAC_SHA_256',
        Message: Buffer.from(code),
      }),
    );
    return Buffer.from(result.Mac!).toString('base64');
  });
  return Promise.all(promises);
}

export const handler = createHandler(
  { serviceName: 'post-recovery-codes' },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
  ): Promise<APIGatewayProxyResult> => {
    // リカバリーコード生成
    const plainCodes = generateRecoveryCodes();

    // HMAC-SHA-256 でハッシュ化
    const hashedCodes = await hashRecoveryCodes(plainCodes);

    // DynamoDB に保存（ハッシュ化済み）
    const docClient = getDocClient();
    await docClient.send(
      new UpdateCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        UpdateExpression: 'SET #recoveryCodes = :codes, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#recoveryCodes': 'recoveryCodes',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':codes': hashedCodes,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );

    // 平文コードをレスポンスで返却（この1回のみ表示）
    return success({ codes: plainCodes });
  },
);
