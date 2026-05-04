import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AssociateSoftwareTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { success } from '../../lib/response';

const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * POST /mfa/setup — TOTP セットアップ開始
 * US-02B: MFA（多要素認証）設定
 * BR-02B-03: QRコードとシークレットキーの両方を提供
 */
export const handler = createHandler(
  { serviceName: 'post-mfa-setup' },
  async (
    event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
  ): Promise<APIGatewayProxyResult> => {
    // Cognito からアクセストークンを取得（Authorization ヘッダーから）
    const accessToken = event.headers['Authorization']?.replace('Bearer ', '') || '';

    const result = await cognitoClient.send(
      new AssociateSoftwareTokenCommand({
        AccessToken: accessToken,
      }),
    );

    const secretCode = result.SecretCode || '';
    // otpauth URI 生成（QRコード用）
    const otpauthUri = `otpauth://totp/SDLC:${auth.email}?secret=${secretCode}&issuer=SDLC`;

    return success({
      secretCode,
      otpauthUri,
    });
  },
);
