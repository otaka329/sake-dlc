# SDLC Backend

AWS Lambda + DynamoDB によるサーバーレスバックエンド。

## API エンドポイント（Unit 1）

| メソッド | パス | 説明 |
|---|---|---|
| POST | /signup | プロファイル初期設定 |
| GET | /profile | プロファイル取得 |
| PUT | /profile | プロファイル更新 |
| POST | /mfa/setup | MFA セットアップ開始 |
| POST | /mfa/verify | MFA 検証・有効化 |
| DELETE | /mfa | MFA 無効化 |
| POST | /mfa/recovery-codes | リカバリーコード発行 |
| PUT | /disclosure-level | 開示レイヤー更新 |

## ローカル開発

```bash
cd backend
npm ci
npm run typecheck
npm run test
npm run build
```

## テスト

```bash
npm run test           # 全テスト実行
npm run test:coverage  # カバレッジ付き
```
