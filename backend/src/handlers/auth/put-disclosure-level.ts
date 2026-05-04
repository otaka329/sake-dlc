import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { updateDisclosureLevelSchema } from '@sdlc/shared-types';
import type { UpdateDisclosureLevelRequest, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { getDocClient, TableNames } from '../../lib/dynamodb';
import { success } from '../../lib/response';
import { NotFoundError } from '../../lib/errors';

/**
 * PUT /disclosure-level — 開示レイヤー更新
 * US-29: 開示レイヤーに応じた表示切替
 * BL-10: 開示レイヤー更新フロー
 * BR-07-05: unlock_category は Layer 2 カテゴリのみ（type, region, temperature）
 * BR-07-08: unlock_all で即全解放
 * BR-07-09: 不可逆（disclosureLevel は増加のみ）
 */
export const handler = createHandler<UpdateDisclosureLevelRequest>(
  {
    schema: updateDisclosureLevelSchema,
    serviceName: 'put-disclosure-level',
  },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: UpdateDisclosureLevelRequest,
  ): Promise<APIGatewayProxyResult> => {
    const docClient = getDocClient();

    // 現在のプロファイルを取得
    const current = await docClient.send(
      new GetCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        ProjectionExpression: 'disclosureLevel, unlockedCategories',
      }),
    );

    if (!current.Item) {
      throw new NotFoundError('プロファイルが見つかりません');
    }

    const currentLevel = (current.Item.disclosureLevel as number) || 1;
    const currentCategories = (current.Item.unlockedCategories as string[]) || [];
    const now = new Date().toISOString();

    if (body.action === 'unlock_all') {
      // 既に全解放済みなら何もしない（冪等）
      if (currentLevel >= 3) {
        return success({ disclosureLevel: 3, unlockedCategories: [] });
      }

      await docClient.send(
        new UpdateCommand({
          TableName: TableNames.users(),
          Key: { userId: auth.userId, entityType: 'PROFILE' },
          UpdateExpression:
            'SET #disclosureLevel = :level, #unlockedCategories = :categories, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#disclosureLevel': 'disclosureLevel',
            '#unlockedCategories': 'unlockedCategories',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':level': 3,
            ':categories': [],
            ':updatedAt': now,
          },
        }),
      );

      return success({ disclosureLevel: 3, unlockedCategories: [] });
    }

    // unlock_category
    const category = body.category;

    // 既に Layer 2 以上なら個別解放は不要
    if (currentLevel >= 2) {
      return success({
        disclosureLevel: currentLevel,
        unlockedCategories: currentCategories,
      });
    }

    // 既に解放済みなら何もしない（冪等）
    if (currentCategories.includes(category)) {
      return success({
        disclosureLevel: currentLevel,
        unlockedCategories: currentCategories,
      });
    }

    const updatedCategories = [...currentCategories, category];

    await docClient.send(
      new UpdateCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        UpdateExpression:
          'SET #unlockedCategories = :categories, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#unlockedCategories': 'unlockedCategories',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':categories': updatedCategories,
          ':updatedAt': now,
        },
      }),
    );

    return success({
      disclosureLevel: currentLevel,
      unlockedCategories: updatedCategories,
    });
  },
);
