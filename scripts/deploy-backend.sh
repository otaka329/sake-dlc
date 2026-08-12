#!/bin/bash
# バックエンドデプロイスクリプト
# 使用方法: ./scripts/deploy-backend.sh <env>
# 例: ./scripts/deploy-backend.sh dev

set -euo pipefail

ENV="${1:?環境名を指定してください（dev / prod）}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/check-aws-account.sh"

echo "=== バックエンドビルド ==="
cd backend
npm ci
npm run build

echo "=== Lambda 関数 zip 化 + デプロイ ==="

# esbuild 出力ディレクトリ（dist/handlers/**/*.mjs）から各 Lambda を zip + デプロイ
deploy_lambda() {
  local FUNC_NAME="$1"
  local SOURCE_PATH="$2"

  if [ ! -f "${SOURCE_PATH}" ]; then
    echo "⚠️ ${SOURCE_PATH} が見つかりません。スキップ: ${FUNC_NAME}"
    return
  fi

  local ZIP_DIR=$(mktemp -d)
  local ZIP_PATH="${ZIP_DIR}/function.zip"

  # .mjs を index.mjs にコピーして zip（handler = index.handler）
  cp "${SOURCE_PATH}" "${ZIP_DIR}/index.mjs"
  # source map があればコピー
  [ -f "${SOURCE_PATH}.map" ] && cp "${SOURCE_PATH}.map" "${ZIP_DIR}/index.mjs.map"

  (cd "${ZIP_DIR}" && zip -q function.zip index.mjs index.mjs.map 2>/dev/null || zip -q function.zip index.mjs)

  echo "更新中: ${FUNC_NAME}"
  aws lambda update-function-code \
    --function-name "${FUNC_NAME}" \
    --zip-file "fileb://${ZIP_PATH}" \
    --no-cli-pager

  rm -rf "${ZIP_DIR}"
}

# Unit 1: Auth ハンドラー
deploy_lambda "sdlc-signup-handler-${ENV}" "dist/handlers/auth/signup.mjs"
deploy_lambda "sdlc-get-profile-${ENV}" "dist/handlers/auth/get-profile.mjs"
deploy_lambda "sdlc-put-profile-${ENV}" "dist/handlers/auth/put-profile.mjs"
deploy_lambda "sdlc-put-disclosure-level-${ENV}" "dist/handlers/auth/put-disclosure-level.mjs"
deploy_lambda "sdlc-post-mfa-setup-${ENV}" "dist/handlers/auth/mfa-setup.mjs"
deploy_lambda "sdlc-post-mfa-verify-${ENV}" "dist/handlers/auth/mfa-verify.mjs"
deploy_lambda "sdlc-delete-mfa-${ENV}" "dist/handlers/auth/delete-mfa.mjs"
deploy_lambda "sdlc-post-recovery-codes-${ENV}" "dist/handlers/auth/recovery-codes.mjs"
deploy_lambda "sdlc-cognito-pre-signup-trigger-${ENV}" "dist/handlers/auth/pre-signup.mjs"
deploy_lambda "sdlc-cognito-daily-backup-${ENV}" "dist/handlers/auth/daily-backup.mjs"

# Unit 2: AI Core ハンドラー
deploy_lambda "sdlc-post-recommend-${ENV}" "dist/handlers/ai/recommend.mjs"
deploy_lambda "sdlc-post-dont-deploy-${ENV}" "dist/handlers/ai/dont-deploy.mjs"
deploy_lambda "sdlc-post-meta-response-${ENV}" "dist/handlers/ai/meta-response.mjs"
deploy_lambda "sdlc-prompt-seeder-${ENV}" "dist/handlers/ai/seed-prompts.mjs"

echo "=== デプロイ完了（${ENV}）==="
