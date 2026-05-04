import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { updateProfileSchema } from '@sdlc/shared-types';
import type { UpdateProfileRequest, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { success } from '../../lib/response';
import { ValidationError } from '../../lib/errors';

/**
 * PUT /profile — ユーザープロファイル更新（部分更新）
 */
export const handler = createHandler<UpdateProfileRequest>(
  {
    schema: updateProfileSchema,
    serviceName: 'put-profile',
  },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: UpdateProfileRequest,
  ): Promise<APIGatewayProxyResult> => {
    const docClient = getDocClient();
    const now = new Date().toISOString();

    // 更新対象フィールドを動的に構築
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionValues: Record<string, unknown> = { ':updatedAt': now };

    if (body.nickname !== undefined) {
      updateExpressions.push('#nickname = :nickname');
      expressionNames['#nickname'] = 'nickname';
      expressionValues[':nickname'] = body.nickname;
    }
    if (body.locale !== undefined) {
      updateExpressions.push('#locale = :locale');
      expressionNames['#locale'] = 'locale';
      expressionValues[':locale'] = body.locale;
    }
    if (body.sakeExperience !== undefined) {
      updateExpressions.push('#sakeExperience = :sakeExperience');
      expressionNames['#sakeExperience'] = 'sakeExperience';
      expressionValues[':sakeExperience'] = body.sakeExperience;
    }

    if (updateExpressions.length === 1) {
      throw new ValidationError('更新するフィールドが指定されていません');
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TableNames.users(),
        Key: {
          userId: auth.userId,
          entityType: 'PROFILE',
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ConditionExpression: 'attribute_exists(userId)',
        ReturnValues: 'ALL_NEW',
      }),
    );

    // SECURITY-09: recoveryCodes 等の内部データをレスポンスから除外
    const item = result.Attributes!;
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
