#!/bin/bash
# 共通 Lambda Layer ビルドスクリプト
#
# 使用方法: ./scripts/build-layer.sh
#
# backend/esbuild.config.mjs が external 指定している
# @aws-lambda-powertools/* と @aws-sdk/* を Layer 側で提供する。
# バージョンは backend/package.json を単一の情報源として読み取るため、
# アプリ側とレイヤー側でバージョンがずれることがない。
#
# 出力: infra/modules/lambda-base/layers/common-layer.zip
#       （Terraform の aws_lambda_layer_version.common が参照）
#
# 生成物は git 管理外。terraform apply の前に実行すること。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR="${REPO_ROOT}/infra/modules/lambda-base/layers"
OUT_ZIP="${OUT_DIR}/common-layer.zip"

echo "=== レイヤー依存の抽出（backend/package.json） ==="
BUILD_DIR=$(mktemp -d)
trap 'rm -rf "${BUILD_DIR}"' EXIT

mkdir -p "${BUILD_DIR}/nodejs"

python3 - "${REPO_ROOT}/backend/package.json" "${BUILD_DIR}/nodejs/package.json" <<'PY'
import json, sys

src, dst = sys.argv[1], sys.argv[2]
deps = json.load(open(src)).get("dependencies", {})

# esbuild の external 指定と対応させる（backend/esbuild.config.mjs 参照）
layer_deps = {
    name: ver
    for name, ver in deps.items()
    if name.startswith("@aws-lambda-powertools/") or name.startswith("@aws-sdk/")
}

if not layer_deps:
    sys.exit("レイヤー対象の依存が見つかりません")

for name, ver in sorted(layer_deps.items()):
    print(f"  {name}: {ver}")

json.dump(
    {"name": "sdlc-common-layer", "version": "1.0.0", "private": True, "dependencies": layer_deps},
    open(dst, "w"),
    indent=2,
)
PY

echo "=== 依存インストール ==="
(cd "${BUILD_DIR}/nodejs" && npm install --omit=dev --no-audit --no-fund --loglevel=error)

echo "=== Powertools のバージョン整合を確認 ==="
# logger/tracer/metrics/commons が同一バージョンでないと実行時に不整合が起きる
python3 - "${BUILD_DIR}/nodejs/node_modules" <<'PY'
import json, os, sys

base = sys.argv[1]
versions = {}
for pkg in ("logger", "tracer", "metrics", "commons"):
    path = os.path.join(base, "@aws-lambda-powertools", pkg, "package.json")
    if os.path.exists(path):
        versions[pkg] = json.load(open(path))["version"]

for pkg, ver in versions.items():
    print(f"  @aws-lambda-powertools/{pkg}: {ver}")

if len(set(versions.values())) > 1:
    sys.exit("❌ Powertools のバージョンが揃っていません")
print("  → 整合 OK")
PY

echo "=== zip 作成 ==="
mkdir -p "${OUT_DIR}"
rm -f "${OUT_ZIP}"
(cd "${BUILD_DIR}" && zip -qr "${OUT_ZIP}" nodejs)

echo "=== 完了 ==="
echo "  ${OUT_ZIP}"
echo "  サイズ: $(du -h "${OUT_ZIP}" | cut -f1)"
