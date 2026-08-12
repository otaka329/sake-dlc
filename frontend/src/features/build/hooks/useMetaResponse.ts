import { useState, useRef, useCallback } from 'react';
import type { MetaResponse } from '@sdlc/shared-types';
import { postMetaResponse } from '../api/build-api';

/**
 * メタ応答呼び出し Hook
 * POST /meta-response + ローディング + エラー
 */
export function useMetaResponse() {
  const [data, setData] = useState<MetaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const askMeta = useCallback(async (message: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);

    try {
      const result = await postMetaResponse(message, abortRef.current.signal);
      setData(result);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('メタ応答失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismiss = useCallback(() => setData(null), []);

  return { data, isLoading, askMeta, dismiss };
}
