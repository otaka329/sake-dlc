import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mfaVerifyRequestSchema } from '@sdlc/shared-types';
import type { MfaVerifyRequest, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { success } from '../../lib/response';
import { ValidationError } from '../../lib/errors';

const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * POST /mfa/verify — TOTP 検証・有効化
 * US-02B: MFA（多要素認証）設定
 * BR-02B-04: 設定完了前にコードで検証
 */
export const handler = createHandler<MfaVerifyRequest>(
  {
    schema: mfaVerifyRequestSchema,
    serviceName: 'post-mfa-verify',
  },
  async (
    event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: MfaVerifyRequest,
  ): Promise<APIGatewayProxyResult> => {
    const accessToken = event.headers['Authorization']?.replace('Bearer ', '') || '';

    // TOTP コード検証
    const verifyResult = await cognitoClient.send(
      new VerifySoftwareTokenCommand({
        AccessToken: accessToken,
        UserCode: body.totpCode,
      }),
    );

    if (verifyResult.Status !== 'SUCCESS') {
      throw new ValidationError('TOTPコードが正しくありません。再度入力してください。');
    }

    // MFA 有効化（TOTP を優先に設定）
    await cognitoClient.send(
      new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        SoftwareTokenMfaSettings: {
          Enabled: true,
          PreferredMfa: true,
        },
      }),
    );

    // Users テーブルの mfaEnabled を更新
    const docClient = getDocClient();
    await docClient.send(
      new UpdateCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        UpdateExpression: 'SET #mfaEnabled = :mfaEnabled, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#mfaEnabled': 'mfaEnabled',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':mfaEnabled': true,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );

    return success({ mfaEnabled: true });
  },
);
