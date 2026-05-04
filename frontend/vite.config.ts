import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: false, // public/manifest.json を使用
      workbox: {
        // キャッシュ戦略は vite.config.ts の runtimeCaching で定義
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API レスポンス: Network-first
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
            },
          },
          {
            // さけのわデータ: Cache-first (TTL 24h)
            urlPattern: /muro\.sakenowa\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sakenowa-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
            },
          },
          {
            // 翻訳ファイル: Stale-while-revalidate
            urlPattern: /\/locales\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'i18n-cache',
              expiration: { maxEntries: 10 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@sdlc/shared-types': resolve(__dirname, '../packages/shared-types/src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router'],
        },
      },
    },
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}', 'tests/**/*.pbt.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
