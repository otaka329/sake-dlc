import { build } from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Lambda ハンドラーのエントリポイントを自動検出してバンドル
 * backend/src/handlers/ 配下の .ts ファイルを個別にバンドル
 */
const handlersDir = 'src/handlers';

function findHandlers(dir) {
  const entries = [];
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      entries.push(...findHandlers(fullPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
      entries.push(fullPath);
    }
  }
  return entries;
}

const entryPoints = findHandlers(handlersDir);

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  sourcemap: true,
  minify: true,
  treeShaking: true,
  external: [
    // Lambda Layer で提供するパッケージ
    '@aws-lambda-powertools/*',
    '@aws-sdk/*',
  ],
  banner: {
    // ESM の require 互換性対応
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log(`ビルド完了: ${entryPoints.length} Lambda 関数`);
