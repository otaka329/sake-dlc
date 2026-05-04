#!/bin/bash
# フロントエンドデプロイスクリプト
# 使用方法: ./scripts/deploy-frontend.sh <env>
# 例: ./scripts/deploy-frontend.sh dev

set -euo pipefail

ENV="${1:?環境名を指定してください（dev / prod）}"
BUCKET="sdlc-frontend-${ENV}"

echo "=== フロントエンドビルド ==="
cd frontend
npm ci
npm run build

echo "=== S3 同期 ==="
aws s3 sync dist/ "s3://${BUCKET}/" --delete

echo "=== CloudFront キャッシュ無効化 ==="
DISTRIBUTION_ID=$(cd ../infra/environments/${ENV} && terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
if [ -n "${DISTRIBUTION_ID}" ]; then
  aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"
  echo "キャッシュ無効化完了: ${DISTRIBUTION_ID}"
else
  echo "⚠️ CloudFront Distribution ID が取得できません。手動で無効化してください。"
fi

echo "=== デプロイ完了（${ENV}）==="
