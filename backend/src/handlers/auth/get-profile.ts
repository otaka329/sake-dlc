import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { success } from '../../lib/response';
import { NotFoundError } from '../../lib/errors';

/**
 * GET /profile — ユーザープロファイル取得
 */
export const handler = createHandler(
  { serviceName: 'get-profile' },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
  ): Promise<APIGatewayProxyResult> => {
    const docClient = getDocClient();

    const result = await docClient.send(
      new GetCommand({
        TableName: TableNames.users(),
        Key: {
          userId: auth.userId,
          entityType: 'PROFILE',
        },
      }),
    );

    if (!result.Item) {
      throw new NotFoundError('プロファイルが見つかりません');
    }

    const item = result.Item;
    return success({
      userId: item.userId,
      email: item.email,
      nickname: item.nickname,
      locale: item.locale,
      sakeExperience: item.sakeExperience,
      authProvider: item.authProvider,
      disclosureLevel: item.disclosureLevel,
      unlockedCategories: item.unlockedCategories,
      googleCalendarLinked: item.googleCalendarLinked,
      notificationEnabled: item.notificationEnabled,
      mfaEnabled: item.mfaEnabled,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  },
);
