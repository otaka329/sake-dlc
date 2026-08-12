import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { metaResponseRequestSchema } from '@sdlc/shared-types';
import type { MetaResponseRequest, AuthContext } from '@sdlc/shared-types';
import { createHandler } from '../../middleware/create-handler';
import { respond } from '../../services/meta-response-service';
import { success } from '../../lib/response';
import { getUserProfileInfo } from '../../lib/user-profile';

/**
 * POST /meta-response — メタ応答
 * US-16: 「飲むべき？」への思慮深い応答
 */
export const handler = createHandler<MetaResponseRequest>(
  {
    schema: metaResponseRequestSchema,
    serviceName: 'post-meta-response',
  },
  async (
    _event: APIGatewayProxyEvent,
    _context: Context,
    auth: AuthContext,
    body: MetaResponseRequest,
  ): Promise<APIGatewayProxyResult> => {
    const { locale } = await getUserProfileInfo(auth.userId);
    const result = await respond(body.message, locale);

    if (result === null) {
      return success({
        message: '推薦画面から「推薦を受ける」を選んでください。',
        suggestedAction: 'reflect',
        forceDeploy: false,
      });
    }

    if ('_dryRun' in result) {
      return success(result.response);
    }

    return success(result);
  },
);
