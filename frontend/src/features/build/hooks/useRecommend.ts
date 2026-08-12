import { useState, useRef, useCallback } from 'react';
import type { PlanInput, RecommendationResponse } from '@sdlc/shared-types';
import { postRecommend } from '../api/build-api';

/**
 * AI 推薦呼び出し Hook
 * POST /recommend + ローディング + エラー + AbortController
 */
export function useRecommend() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const recommend = useCallback(async (planInput: PlanInput) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const result = await postRecommend(planInput, abortRef.current.signal);
      setData(result);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || '推薦の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, recommend };
}
