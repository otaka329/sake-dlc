import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { planInputSchema } from '@sdlc/shared-types';
import type { PlanInput, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { judge } from '../../services/dont-deploy-service';
import { success } from '../../lib/response';
import { getUserProfileInfo } from '../../lib/user-profile';

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
    const { locale } = await getUserProfileInfo(auth.userId);
    const result = await judge(body, auth.userId, locale);

    if ('_dryRun' in result) {
      return success(result.response);
    }

    return success(result);
  },
);
