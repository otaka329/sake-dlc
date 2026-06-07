import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { planInputSchema } from '@sdlc/shared-types';
import type { PlanInput, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { judge } from '../../services/dont-deploy-service';
import { success } from '../../lib/response';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, TableNames } from '../../lib/dynamodb';

/**
 * POST /dont-deploy — Don't Deploy Today 判定
 * US-09: Don't Deploy Today判定、US-10: ノンアル代替提案
 */
export const handler = createHandler<PlanInput>(
  {
    schema: planInputSchema,
    serviceName: 'post-dont-deploy',
  },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: PlanInput,
  ): Promise<APIGatewayProxyResult> => {
    // ユーザーの locale を取得
    const docClient = getDocClient();
    const userResult = await docClient.send(
      new GetCommand({
        TableName: TableNames.users(),
        Key: { userId: auth.userId, entityType: 'PROFILE' },
        ProjectionExpression: 'locale',
      }),
    );
    const locale = (userResult.Item?.locale as string) || 'ja';

    // 判定実行
    const result = await judge(body, auth.userId, locale);

    // ドライラン判定
    if ('_dryRun' in result) {
      return success(result.response);
    }

    return success(result);
  },
);
