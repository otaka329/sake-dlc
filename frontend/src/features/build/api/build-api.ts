import { apiClient } from '@/lib/api-client';
import type { PlanInput, RecommendationResponse, MetaResponse } from '@sdlc/shared-types';

/**
 * Build API クライアント
 */
export async function postRecommend(planInput: PlanInput, signal?: AbortSignal): Promise<RecommendationResponse> {
  return apiClient.post('recommend', { json: planInput, signal }).json<RecommendationResponse>();
}

export async function postMetaResponse(message: string, signal?: AbortSignal): Promise<MetaResponse> {
  return apiClient.post('meta-response', { json: { message }, signal }).json<MetaResponse>();
}
