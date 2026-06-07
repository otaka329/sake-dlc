import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { planInputSchema } from '@sdlc/shared-types';
import type { PlanInput, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { recommend } from '../../services/recommendation-service';
import { success } from '../../lib/response';
import { getUserProfileInfo } from '../../lib/user-profile';

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
    const { disclosureLevel, locale } = await getUserProfileInfo(auth.userId);
    const result = await recommend(body, auth.userId, disclosureLevel, locale);

    if ('_dryRun' in result) {
      return success(result.response);
    }

    return success(result);
  },
);
