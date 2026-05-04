import ky from 'ky';
import { getTokens, clearTokens } from './token-storage';

/**
 * API クライアント（ky ベース）
 * NFR Design §2.1: リトライ、トークンリフレッシュ、エラーハンドリング
 */

const apiClient = ky.create({
  prefixUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  retry: {
    limit: 2,
    methods: ['get', 'put', 'delete'],
    statusCodes: [408, 500, 502, 503, 504],
    backoffLimit: 600,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Authorization ヘッダー自動付与
        const tokens = getTokens();
        if (tokens?.accessToken) {
          request.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // 401 時のトークンリフレッシュ
        if (response.status === 401) {
          // TODO: Cognito SDK でリフレッシュトークンを使って更新
          // 失敗時はログアウト
          clearTokens();
          window.location.href = '/login';
        }
      },
    ],
  },
});

export { apiClient };
