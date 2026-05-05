import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { signupRequestSchema } from '@sdlc/shared-types';
import type { SignupRequest, DisclosureLevel, UnlockCategory } from '@sdlc/shared-types';
import type { AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { created } from '../../lib/response';

/**
 * POST /signup — ユーザープロファイル初期設定
 * US-01: ユーザー登録、US-02: ソーシャルログイン、US-30: オンボーディング経験レベル選択
 * BL-06: POST /signup ハンドラーロジック
 *
 * ブロックリスト照合（BR-01-07）はフロントエンド（SignupPage.tsx）で実施。
 * サーバーサイド再検証は Unit 2 の Cognito SDK 統合時に正規フロー
 * （Custom Auth Challenge または Pre Auth Trigger）で実装予定。
 */

/**
 * sakeExperience から初期 disclosureLevel と unlockedCategories を算出
 * BR-07-01〜04
 */
function calculateInitialDisclosure(sakeExperience?: string): {
  disclosureLevel: DisclosureLevel;
  unlockedCategories: UnlockCategory[];
} {
  switch (sakeExperience) {
    case 'intermediate':
      return { disclosureLevel: 1, unlockedCategories: ['type', 'region'] };
    case 'advanced':
      return { disclosureLevel: 3, unlockedCategories: [] };
    default:
      // beginner または未指定
      return { disclosureLevel: 1, unlockedCategories: [] };
  }
}

export const handler = createHandler<SignupRequest>(
  {
    schema: signupRequestSchema,
    serviceName: 'signup-handler',
  },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: SignupRequest,
  ): Promise<APIGatewayProxyResult> => {
    const docClient = getDocClient();
    const now = new Date().toISOString();

    // 開示レイヤー初期値の算出（BR-07-01〜04）
    const { disclosureLevel, unlockedCategories } = calculateInitialDisclosure(
      body.sakeExperience,
    );

    // User レコード作成
    const user = {
      userId: auth.userId,
      entityType: 'PROFILE',
      email: auth.email,
      nickname: body.nickname,
      locale: body.locale,
      sakeExperience: body.sakeExperience || null,
      authProvider: 'email', // JWT の identities から判定（簡略化）
      disclosureLevel,
      unlockedCategories,
      googleCalendarLinked: false,
      notificationEnabled: true,
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    // トランザクション書き込み（User + TasteProfile を原子的に作成）
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: TableNames.users(),
              Item: user,
              ConditionExpression: 'attribute_not_exists(userId)',
            },
          },
          {
            Put: {
              TableName: TableNames.tasteProfiles(),
              Item: {
                userId: auth.userId,
                f1: 0.5,
                f2: 0.5,
                f3: 0.5,
                f4: 0.5,
                f5: 0.5,
                f6: 0.5,
                updatedAt: now,
              },
            },
          },
        ],
      }),
    );

    return created({
      userId: user.userId,
      email: user.email,
      nickname: user.nickname,
      locale: user.locale,
      sakeExperience: user.sakeExperience,
      authProvider: user.authProvider,
      disclosureLevel: user.disclosureLevel,
      unlockedCategories: user.unlockedCategories,
      googleCalendarLinked: user.googleCalendarLinked,
      notificationEnabled: user.notificationEnabled,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  },
);
