#!/bin/bash
# バックエンドデプロイスクリプト
# 使用方法: ./scripts/deploy-backend.sh <env>
# 例: ./scripts/deploy-backend.sh dev

set -euo pipefail

ENV="${1:?環境名を指定してください（dev / prod）}"

echo "=== バックエンドビルド ==="
cd backend
npm ci
npm run build

echo "=== Lambda 関数更新 ==="
LAMBDA_FUNCTIONS=(
  "sdlc-signup-handler-${ENV}"
  "sdlc-get-profile-${ENV}"
  "sdlc-put-profile-${ENV}"
  "sdlc-put-disclosure-level-${ENV}"
  "sdlc-post-mfa-setup-${ENV}"
  "sdlc-post-mfa-verify-${ENV}"
  "sdlc-delete-mfa-${ENV}"
  "sdlc-post-recovery-codes-${ENV}"
  "sdlc-cognito-pre-signup-trigger-${ENV}"
  "sdlc-cognito-daily-backup-${ENV}"
)

for FUNC in "${LAMBDA_FUNCTIONS[@]}"; do
  HANDLER_NAME=$(echo "${FUNC}" | sed "s/sdlc-//" | sed "s/-${ENV}//")
  ZIP_PATH="dist/handlers/auth/${HANDLER_NAME}.zip"

  if [ -f "${ZIP_PATH}" ]; then
    echo "更新中: ${FUNC}"
    aws lambda update-function-code \
      --function-name "${FUNC}" \
      --zip-file "fileb://${ZIP_PATH}" \
      --no-cli-pager
  else
    echo "⚠️ ${ZIP_PATH} が見つかりません。スキップ: ${FUNC}"
  fi
done

echo "=== デプロイ完了（${ENV}）==="
