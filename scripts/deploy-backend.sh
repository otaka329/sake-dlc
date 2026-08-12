#!/bin/bash
# バックエンドデプロイスクリプト
# 使用方法: ./scripts/deploy-backend.sh <env>
# 例: ./scripts/deploy-backend.sh dev

set -euo pipefail

ENV="${1:?環境名を指定してください（dev / prod）}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/lib/check-aws-account.sh"

echo "=== バックエンドビルド ==="
# npm workspaces のため、依存インストールは必ずリポジトリルートで行う。
# backend/ で npm ci するとルートの node_modules が消え、
# frontend / shared-types のツールチェーンごと壊れる。
cd "${REPO_ROOT}"
npm ci
npm run build --workspace @sdlc/backend
cd "${REPO_ROOT}/backend"

echo "=== Lambda 関数 zip 化 + デプロイ ==="

# Terraform 未定義などで AWS 上に存在しない関数を記録する。
# 黙って飛ばすと「何もデプロイしていないのに成功」に見えるため、
# 最後にまとめて報告し、1件でもあれば非ゼロ終了する。
MISSING_FUNCS=()

# esbuild 出力（dist/<auth|ai>/*.mjs）から各 Lambda を zip + デプロイ
deploy_lambda() {
  local FUNC_NAME="$1"
  local SOURCE_PATH="$2"

  # ビルド成果物が無い場合は即エラー。
  # 「スキップして正常終了」だと、何もデプロイしていないのに成功に見えてしまう
  # （esbuild の出力パスが dist/handlers/... ではなく dist/... である点を過去2回取り違えた）
  if [ ! -f "${SOURCE_PATH}" ]; then
    echo "❌ ビルド成果物が見つかりません: ${SOURCE_PATH}（${FUNC_NAME}）" >&2
    echo "   npm run build の出力先と deploy_lambda のパス指定が一致しているか確認してください。" >&2
    exit 1
  fi

  # AWS 上に関数が存在するか（Terraform 未適用・未定義の検出）
  if ! aws lambda get-function --function-name "${FUNC_NAME}" > /dev/null 2>&1; then
    echo "⏭  未作成のためスキップ: ${FUNC_NAME}"
    MISSING_FUNCS+=("${FUNC_NAME}")
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
deploy_lambda "sdlc-signup-handler-${ENV}" "dist/auth/signup.mjs"
deploy_lambda "sdlc-get-profile-${ENV}" "dist/auth/get-profile.mjs"
deploy_lambda "sdlc-put-profile-${ENV}" "dist/auth/put-profile.mjs"
deploy_lambda "sdlc-put-disclosure-level-${ENV}" "dist/auth/put-disclosure-level.mjs"
deploy_lambda "sdlc-post-mfa-setup-${ENV}" "dist/auth/mfa-setup.mjs"
deploy_lambda "sdlc-post-mfa-verify-${ENV}" "dist/auth/mfa-verify.mjs"
deploy_lambda "sdlc-delete-mfa-${ENV}" "dist/auth/delete-mfa.mjs"
deploy_lambda "sdlc-post-recovery-codes-${ENV}" "dist/auth/recovery-codes.mjs"
deploy_lambda "sdlc-cognito-pre-signup-trigger-${ENV}" "dist/auth/pre-signup.mjs"
deploy_lambda "sdlc-cognito-daily-backup-${ENV}" "dist/auth/daily-backup.mjs"

# Unit 2: AI Core ハンドラー
deploy_lambda "sdlc-post-recommend-${ENV}" "dist/ai/recommend.mjs"
deploy_lambda "sdlc-post-dont-deploy-${ENV}" "dist/ai/dont-deploy.mjs"
deploy_lambda "sdlc-post-meta-response-${ENV}" "dist/ai/meta-response.mjs"
deploy_lambda "sdlc-prompt-seeder-${ENV}" "dist/ai/seed-prompts.mjs"

# プロンプトテンプレートの投入
#
# Terraform の Custom Resource ではなくここで起動する。
# apply の時点では Lambda にプレースホルダーコードしか載っていないため、
# 実コードを配った直後のこのタイミングでないと投入できない。
# テンプレート定義とバージョンは Terraform が環境変数で渡している。
echo "=== プロンプトテンプレート投入 ==="
if ! aws lambda get-function --function-name "sdlc-prompt-seeder-${ENV}" > /dev/null 2>&1; then
  echo "⏭  シーダー関数が未作成のため投入をスキップ"
else
SEED_OUT=$(mktemp)
aws lambda invoke \
  --function-name "sdlc-prompt-seeder-${ENV}" \
  --cli-binary-format raw-in-base64-out \
  --payload '{}' \
  --no-cli-pager \
  "${SEED_OUT}" > /dev/null

if grep -q '"errorType"' "${SEED_OUT}"; then
  echo "❌ プロンプト投入に失敗しました:" >&2
  cat "${SEED_OUT}" >&2
  rm -f "${SEED_OUT}"
  exit 1
fi

echo "  $(cat "${SEED_OUT}")"
rm -f "${SEED_OUT}"
fi

if [ ${#MISSING_FUNCS[@]} -gt 0 ]; then
  echo "" >&2
  echo "❌ デプロイ未完了: 以下の関数が AWS 上に存在しません（${#MISSING_FUNCS[@]}件）" >&2
  for f in "${MISSING_FUNCS[@]}"; do echo "   - $f" >&2; done
  echo "   Terraform に aws_lambda_function の定義があるか、apply 済みかを確認してください。" >&2
  exit 1
fi

echo "=== デプロイ完了（${ENV}）==="
