import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { planInputSchema } from '@sdlc/shared-types';
import type { PlanInput, AuthContext, DisclosureLevel } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { recommend } from '../../services/recommendation-service';
import { success } from '../../lib/response';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, TableNames } from '../../lib/dynamodb';

/**
 * POST /recommend — AI 日本酒推薦
 * US-08: AI日本酒推薦、US-11: 推薦結果のカスタマイズ
 */
export const handler = createHandler<PlanInput>(
  {
    schema: planInputSchema,
    serviceName: 'post-recommend',
  },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: PlanInput,
  ): Promise<APIGatewayProxyResult> => {
    // ユーザーの disclosureLevel と locale を取得
    const docClient = getDocClient();
    const userResult = await docClient.send(
      new GetCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        ProjectionExpression: 'disclosureLevel, locale',
      }),
    );

    const disclosureLevel = (userResult.Item?.disclosureLevel as DisclosureLevel) || 1;
    const locale = (userResult.Item?.locale as string) || 'ja';

    // 推薦実行
    const result = await recommend(body, auth.userId, disclosureLevel, locale);

    // ドライラン判定
    if ('_dryRun' in result) {
      return success(result.response);
    }

    return success(result);
  },
);
