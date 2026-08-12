#!/bin/bash
# AWS アカウント検証ガード
#
# 使い方: 各デプロイスクリプトの冒頭で source する。
#   source "$(dirname "$0")/lib/check-aws-account.sh"
#
# 現在の認証情報が SDLC 用アカウント以外を指している場合、即座に終了する。
# 開発端末には多数の業務アカウントのプロファイルが同居しているため、
# AWS_PROFILE の消し忘れや SSO セッションの残留による誤デプロイを防ぐ。
#
# 同じアカウント ID を infra/environments/*/backend.tf の
# provider.allowed_account_ids にも設定している（Terraform 側のガード）。

SDLC_AWS_ACCOUNT_ID="441713519216"

echo "=== AWS アカウント検証 ==="

CURRENT_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

if [ -z "${CURRENT_ACCOUNT_ID}" ]; then
  echo "❌ AWS 認証情報を取得できません。" >&2
  echo "   aws sso login などでログインしてから再実行してください。" >&2
  echo "   想定アカウント: ${SDLC_AWS_ACCOUNT_ID}" >&2
  exit 1
fi

if [ "${CURRENT_ACCOUNT_ID}" != "${SDLC_AWS_ACCOUNT_ID}" ]; then
  echo "❌ 想定外の AWS アカウントに接続しています。デプロイを中止します。" >&2
  echo "   想定: ${SDLC_AWS_ACCOUNT_ID}" >&2
  echo "   現在: ${CURRENT_ACCOUNT_ID}" >&2
  echo "   AWS_PROFILE=${AWS_PROFILE:-(未設定)}" >&2
  exit 1
fi

echo "✅ アカウント ${CURRENT_ACCOUNT_ID}（AWS_PROFILE=${AWS_PROFILE:-未設定}）"
