import { useCallback, useRef, useEffect } from 'react';
import type { PlanInput } from '@sdlc/shared-types';
import { postDontDeploy } from '../api/plan-api';
import { usePlan } from '@/contexts/PlanContext';

/**
 * Don't Deploy 自動判定 Hook（1秒デバウンス）
 * カード入力変更ごとに自動呼び出し
 *
 * H1: 初回マウント時はスキップ（dirty フラグ）
 * H2: 依存配列は呼び出し元で管理（trigger の引数で入力を渡す）
 * H3: クリーンアップ（timer + AbortController）+ レース対策（リクエスト世代管理）
 */
export function useDontDeploy() {
  const { setDeployAdvice, setLoading } = usePlan();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const isDirtyRef = useRef(false);

  // クリーンアップ: unmount 時にタイマーと in-flight リクエストをキャンセル
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const trigger = useCallback(
    (planInput: PlanInput) => {
      // H1: 初回マウント時はスキップ（最初の trigger 呼び出しは初期値なので無視）
      if (!isDirtyRef.current) {
        isDirtyRef.current = true;
        return;
      }

      // デバウンス: 前のタイマーをクリア
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        // H3: 前の in-flight リクエストをキャンセル
        if (abortRef.current) {
          abortRef.current.abort();
        }
        abortRef.current = new AbortController();

        // レース対策: リクエスト世代を記録
        const currentGeneration = ++generationRef.current;

        // M1: ローディング開始
        setLoading(true);

        try {
          const advice = await postDontDeploy(planInput, abortRef.current.signal);

          // レース対策: 古い世代のレスポンスは無視
          if (currentGeneration !== generationRef.current) return;

          setDeployAdvice(advice);
        } catch (err) {
          // AbortError は正常キャンセル（無視）
          if ((err as Error).name === 'AbortError') return;
          // レース対策: 古い世代のエラーは無視
          if (currentGeneration !== generationRef.current) return;

          console.error('Don\'t Deploy 判定失敗:', err);
        } finally {
          // M1: ローディング終了（現世代のみ）
          if (currentGeneration === generationRef.current) {
            setLoading(false);
          }
        }
      }, 1000);
    },
    [setDeployAdvice, setLoading],
  );

  return { trigger };
}
