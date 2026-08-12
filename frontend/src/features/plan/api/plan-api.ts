import { apiClient } from '@/lib/api-client';
import type { PlanInput, DeployAdvice } from '@sdlc/shared-types';

/**
 * Plan API クライアント
 * POST /dont-deploy: Don't Deploy Today 判定
 */
export async function postDontDeploy(planInput: PlanInput, signal?: AbortSignal): Promise<DeployAdvice> {
  return apiClient.post('dont-deploy', { json: planInput, signal }).json<DeployAdvice>();
}
