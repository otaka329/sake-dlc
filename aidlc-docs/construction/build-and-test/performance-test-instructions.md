# パフォーマンステスト手順

## 目的

Unit 1 Foundation のパフォーマンス要件（NFR Requirements §1）への適合を検証する。

## パフォーマンス要件

### バックエンド

| 指標 | 目標値 | テスト方法 |
|---|---|---|
| API 応答時間（認証系） | 500ms 以内 | k6 負荷テスト |
| API 応答時間（プロファイル CRUD） | 200ms 以内 | k6 負荷テスト |
| Lambda コールドスタート | 3秒以内 | CloudWatch Logs 分析 |

### フロントエンド

| 指標 | 目標値 | テスト方法 |
|---|---|---|
| 初期ロードサイズ | 200KB 以下（gzip 後） | `vite build` 出力確認 |
| LCP | 2秒以内 | Lighthouse |
| INP | 200ms 以内 | Web Vitals |
| CLS | 0.1 以下 | Lighthouse |

## フロントエンド パフォーマンステスト

### 1. バンドルサイズ確認

```bash
cd frontend
npm run build

# ビルド出力のサイズ確認
ls -la dist/assets/*.js | awk '{print $5, $9}'

# gzip サイズ確認
gzip -c dist/assets/index-*.js | wc -c
```

**期待結果**: 初期ロード JS が 200KB（gzip 後）以内

### 2. Lighthouse 監査

```bash
# Chrome DevTools → Lighthouse タブ
# または CLI:
npx lighthouse http://localhost:5173 --output=json --output-path=./lighthouse-report.json
```

**確認項目**:
- Performance スコア: 90 以上
- LCP: 2秒以内
- CLS: 0.1 以下
- INP: 200ms 以内（実操作で確認）

### 3. バンドル分析

```bash
cd frontend
npx vite-bundle-visualizer
# ブラウザで分析結果を確認
```

## バックエンド パフォーマンステスト

### 1. k6 負荷テスト（dev 環境）

```javascript
// tests/performance/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // ランプアップ
    { duration: '1m', target: 50 },   // 定常負荷
    { duration: '30s', target: 0 },   // ランプダウン
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95%ile < 500ms
    http_req_failed: ['rate<0.01'],    // エラー率 < 1%
  },
};

export default function () {
  const params = {
    headers: {
      'Authorization': `Bearer ${__ENV.ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // GET /profile
  const profileRes = http.get(`${__ENV.API_URL}/profile`, params);
  check(profileRes, {
    'GET /profile status 200': (r) => r.status === 200,
    'GET /profile duration < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### 2. 実行

```bash
# k6 インストール
brew install k6

# 実行（dev 環境）
k6 run \
  -e API_URL=https://xxx.execute-api.ap-northeast-1.amazonaws.com/dev \
  -e ACCESS_TOKEN=<valid-token> \
  tests/performance/api-load-test.js
```

### 3. コールドスタート計測

```bash
# CloudWatch Logs Insights で計測
# クエリ:
# fields @timestamp, @duration, @initDuration
# | filter @type = "REPORT"
# | stats avg(@initDuration) as avgColdStart, max(@initDuration) as maxColdStart
```

**期待結果**: initDuration（コールドスタート）が 3秒以内

## レート制限テスト

```bash
# 100回連続リクエスト → 全て成功
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer $TOKEN" \
    "$API_URL/profile"
done

# 101回目 → 429
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$API_URL/profile"
# 期待: 429
```

## 結果記録

テスト結果は以下に記録:
- k6 レポート: `tests/performance/results/`
- Lighthouse レポート: `tests/performance/lighthouse-report.json`
- バンドルサイズ: ビルドログ
