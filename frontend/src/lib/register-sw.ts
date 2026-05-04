/**
 * Service Worker 登録
 * US-25: ホーム画面への追加
 * US-26: オフライン対応
 * vite-plugin-pwa が vite.config.ts の設定に基づいて SW をビルド・注入。
 * ここでは registerType: 'autoUpdate' により自動登録されるため、
 * 手動登録は vite-plugin-pwa が対応しない環境向けのフォールバック。
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW 登録成功:', registration.scope);
      })
      .catch((error) => {
        console.error('SW 登録失敗:', error);
      });
  });
}
