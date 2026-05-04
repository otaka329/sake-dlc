# Unit 1: Foundation — ドメインエンティティ

---

## User（ユーザー）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| userId | string (UUID) | Yes | 一意識別子（Cognito sub） |
| email | string | Yes | メールアドレス |
| nickname | string | Yes | 表示名（2〜20文字） |
| locale | enum (ja, en) | Yes | 表示言語（デフォルト: ブラウザ言語から自動判定） |
| sakeExperience | enum (beginner, intermediate, advanced) | No | 日本酒経験レベル（任意。未設定時は beginner 扱い） |
| authProvider | enum (email, google, apple) | Yes | 認証プロバイダー |
| disclosureLevel | number (1, 2, 3) | Yes | 開示レイヤー（デフォルト: 1）。sakeExperience から初期値を算出 |
| unlockedCategories | string[] | Yes | Layer 2 個別解放済みカテゴリ（デフォルト: []）。「もっと詳しく」タップで追加 |
| googleCalendarLinked | boolean | Yes | Google Calendar連携状態（デフォルト: false） |
| notificationEnabled | boolean | Yes | プッシュ通知有効（デフォルト: true） |
| mfaEnabled | boolean | Yes | MFA有効（デフォルト: false） |
| mfaSecret | string | No | TOTP シークレットキー（MFA有効時のみ。暗号化して保存） |
| recoveryCodes | string[] | No | リカバリーコード（ハッシュ化済み、MFA有効時のみ） |
| createdAt | ISO8601 string | Yes | 作成日時 |
| updatedAt | ISO8601 string | Yes | 更新日時 |

---

## UserSession（ユーザーセッション）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| accessToken | string (JWT) | Yes | Cognito アクセストークン |
| idToken | string (JWT) | Yes | Cognito IDトークン |
| refreshToken | string | Yes | Cognito リフレッシュトークン |
| expiresAt | ISO8601 string | Yes | トークン有効期限 |

---

## AppSettings（アプリ設定 — フロントエンドローカル）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| locale | enum (ja, en) | Yes | 現在の表示言語 |
| theme | enum (light, dark, system) | Yes | テーマ設定（デフォルト: system） |
| offlineDataVersion | string | No | オフラインキャッシュのバージョン |
