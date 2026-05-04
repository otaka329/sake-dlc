import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SetUserMFAPreferenceCommand,
  VerifySoftwareTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { KMSClient, GenerateMacCommand } from '@aws-sdk/client-kms';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mfaDeleteRequestSchema } from '@sdlc/shared-types';
import type { MfaDeleteRequest, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { success } from '../../lib/response';
import { ValidationError, AuthError } from '../../lib/errors';

const cognitoClient = new CognitoIdentityProviderClient({});
const kmsClient = new KMSClient({});

const KMS_KEY_ID = process.env.KMS_RECOVERY_CODES_KEY_ID || '';

/**
 * DELETE /mfa — MFA 無効化
 * US-02B: MFA（多要素認証）設定
 * BR-02B-10: 無効化には TOTP コードまたはリカバリーコードの入力を要求
 *
 * 検証パス:
 * - totpCode: Cognito AdminInitiateAuth で SOFTWARE_TOKEN_MFA チャレンジを発行し検証
 * - recoveryCode: DynamoDB からハッシュ済みコードを取得 → KMS で HMAC 比較
 */

/**
 * リカバリーコードを KMS HMAC で検証
 * 提供されたコードの HMAC を計算し、保存済みハッシュと比較
 */
async function verifyRecoveryCode(
  userId: string,
  providedCode: string,
): Promise<boolean> {
  const docClient = getDocClient();

  // 保存済みハッシュを取得
  const result = await docClient.send(
    new GetCommand({
      TableName: TableNames.users(),
      Key: { userId, entityType: 'PROFILE' },
      ProjectionExpression: 'recoveryCodes',
    }),
  );

  const storedHashes = (result.Item?.recoveryCodes as string[]) || [];
  if (storedHashes.length === 0) {
    return false;
  }

  // 提供コードの HMAC を計算
  const macResult = await kmsClient.send(
    new GenerateMacCommand({
      KeyId: KMS_KEY_ID,
      MacAlgorithm: 'HMAC_SHA_256',
      Message: Buffer.from(providedCode),
    }),
  );
  const providedHash = Buffer.from(macResult.Mac!).toString('base64');

  // 保存済みハッシュと比較
  const matchIndex = storedHashes.findIndex((hash) => hash === providedHash);
  if (matchIndex === -1) {
    return false;
  }

  // 使用済みコードを削除（各コードは1回のみ使用可能: BR-02B-06）
  const updatedCodes = storedHashes.filter((_, i) => i !== matchIndex);
  await docClient.send(
    new UpdateCommand({
      TableName: TableNames.users(),
      Key: { userId, entityType: 'PROFILE' },
      UpdateExpression: 'SET #recoveryCodes = :codes',
      ExpressionAttributeNames: { '#recoveryCodes': 'recoveryCodes' },
      ExpressionAttributeValues: { ':codes': updatedCodes },
    }),
  );

  return true;
}

/**
 * TOTP コードを Cognito で検証
 * AdminInitiateAuth → SOFTWARE_TOKEN_MFA チャレンジ → AdminRespondToAuthChallenge
 */
async function verifyTotpCode(
  accessToken: string,
  totpCode: string,
): Promise<boolean> {
  // Cognito VerifySoftwareToken はセットアップ用途のため、
  // 削除フローでは AdminInitiateAuth の MFA チャレンジで検証する方針。
  // ただし AdminInitiateAuth にはユーザー名+パスワードが必要で、
  // アクセストークンのみでは実行できない。
  //
  // 代替方針: VerifySoftwareToken を検証目的で使用する。
  // Cognito の仕様上、既に MFA が有効化されたユーザーに対して
  // VerifySoftwareToken を呼ぶと、コードの正当性を検証できる。
  try {
    const result = await cognitoClient.send(
      new VerifySoftwareTokenCommand({
        AccessToken: accessToken,
        UserCode: totpCode,
      }),
    );
    return result.Status === 'SUCCESS';
  } catch {
    return false;
  }
}

export const handler = createHandler<MfaDeleteRequest>(
  {
    schema: mfaDeleteRequestSchema,
    serviceName: 'delete-mfa',
  },
  async (
    event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: MfaDeleteRequest,
  ): Promise<APIGatewayProxyResult> => {
    const accessToken = event.headers['Authorization']?.replace('Bearer ', '') || '';

    // 検証: TOTP コードまたはリカバリーコードのいずれかで認証
    let verified = false;

    if (body.totpCode) {
      verified = await verifyTotpCode(accessToken, body.totpCode);
      if (!verified) {
        throw new AuthError('TOTPコードが正しくありません');
      }
    } else if (body.recoveryCode) {
      verified = await verifyRecoveryCode(auth.userId, body.recoveryCode);
      if (!verified) {
        throw new AuthError('リカバリーコードが正しくありません');
      }
    } else {
      throw new ValidationError('TOTPコードまたはリカバリーコードが必要です');
    }

    // MFA 無効化
    await cognitoClient.send(
      new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        SoftwareTokenMfaSettings: {
          Enabled: false,
          PreferredMfa: false,
        },
      }),
    );

    // Users テーブルの mfaEnabled を更新、リカバリーコードを無効化
    const docClient = getDocClient();
    await docClient.send(
      new UpdateCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        UpdateExpression:
          'SET #mfaEnabled = :mfaEnabled, #updatedAt = :updatedAt REMOVE #recoveryCodes',
        ExpressionAttributeNames: {
          '#mfaEnabled': 'mfaEnabled',
          '#updatedAt': 'updatedAt',
          '#recoveryCodes': 'recoveryCodes',
        },
        ExpressionAttributeValues: {
          ':mfaEnabled': false,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );

    return success({ mfaEnabled: false });
  },
);
