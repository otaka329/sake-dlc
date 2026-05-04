# Unit 1: Foundation — ビジネスロジックモデル

---

## BL-01: ユーザー登録フロー

```
1. ユーザーがメール＋パスワードを入力
2. フロントエンドバリデーション（BR-01-01, BR-01-02）
3. Cognito signUp API 呼び出し
4. Cognito Pre Sign-up Lambda Trigger が発火（BL-08）
   4a. ブロックリスト照合 → 合格 → 続行
   4b. ブロックリスト照合 → 不合格 → エラー返却（拒否理由 + ガイダンス）
5. Cognito が確認メール送信
6. ユーザーがメール内リンクをクリック → confirmSignUp
7. 自動ログイン → トークン取得
8. User.nickname が未設定 → プロファイル設定画面に遷移
9. プロファイル入力（ニックネーム, 言語, 経験レベル）
10. POST /signup API → User レコード作成 + TasteProfile 初期化
11. ホーム画面（タブナビゲーション）に遷移
```

---

## BL-02: ソーシャルログインフロー

```
1. ユーザーが Google/Apple ボタンをタップ
2. Cognito Hosted UI → OAuth プロバイダーにリダイレクト
3. OAuth 認証完了 → Cognito にコールバック
4. Cognito がトークン発行
5. フロントエンドがトークン受信
6. GET /profile API でユーザー情報取得
7a. 既存ユーザー → ホーム画面に遷移
7b. 新規ユーザー（nickname 未設定）→ プロファイル設定画面に遷移
8. （新規の場合）プロファイル入力 → POST /signup API
9. ホーム画面に遷移
```

---

## BL-03: 言語切替フロー

```
1. ユーザーが設定画面で言語を選択（ja/en）
2. react-i18next の言語を即時切替
3. localStorage に言語設定を保存
4. PUT /profile API で User.locale を更新（バックグラウンド）
5. AI応答の言語も次回リクエストから切替
```

---

## BL-04: 認証状態管理フロー

```
アプリ起動時:
1. localStorage からトークンを読み込み
2. トークンが存在しない → ログイン画面
3. トークンが存在 → 有効期限チェック
4a. 有効 → AuthContext にセット → ホーム画面
4b. 期限切れ → refreshToken で更新試行
5a. 更新成功 → AuthContext にセット → ホーム画面
5b. 更新失敗 → ローカルストレージクリア → ログイン画面

API呼び出し時:
1. AuthContext から accessToken を取得
2. Authorization: Bearer {accessToken} ヘッダーを付与
3. 401レスポンス → refreshToken で更新試行
4a. 更新成功 → リクエストリトライ
4b. 更新失敗 → ログイン画面にリダイレクト
```

---

## BL-05: PWA オフライン対応フロー

```
Service Worker キャッシュ戦略:
- 静的アセット（JS, CSS, 画像）: Cache-first
- API レスポンス: Network-first（フォールバック: キャッシュ）
- さけのわデータ: Cache-first（TTL 24h）

オフライン時:
1. ネットワーク状態を検出（navigator.onLine + online/offline イベント）
2. オフラインバナーを表示
3. キャッシュされたデータで閲覧系機能を提供
4. 書き込み系操作はキューに保存（IndexedDB）

オンライン復帰時:
1. online イベント検出
2. キューに溜まった操作をバックグラウンド同期
3. オフラインバナーを非表示
```

---

## BL-06: POST /signup ハンドラーロジック

```
入力: { nickname, locale, sakeExperience? }
認証: Cognito JWT から userId を抽出

1. 入力バリデーション（BR-03-01〜BR-03-04）
2. 開示レイヤー初期値の算出（BR-07-01〜04）:
   a. sakeExperience 未指定 or "beginner" → disclosureLevel = 1, unlockedCategories = []
   b. "intermediate" → disclosureLevel = 1, unlockedCategories = ["type", "region"]
   c. "advanced" → disclosureLevel = 3, unlockedCategories = []
3. DynamoDB Users テーブルに User レコード作成
   - userId, email（JWT から）, nickname, locale, sakeExperience (or null)
   - authProvider（JWT の identities から判定）
   - disclosureLevel, unlockedCategories
   - googleCalendarLinked: false
   - notificationEnabled: true
   - createdAt, updatedAt: 現在時刻
4. DynamoDB TasteProfiles テーブルに初期プロファイル作成
   - userId
   - f1〜f6: すべて 0.5（中央値）
   - updatedAt: 現在時刻
5. 成功レスポンス: 201 Created + User オブジェクト（disclosureLevel 含む）
```

---

## BL-07: MFA設定フロー

```
MFA有効化:
1. ユーザーが設定画面で「MFAを有効化」をタップ
2. Cognito associateSoftwareToken API → TOTPシークレット取得
3. QRコード（otpauth:// URI）とシークレットキー（手動入力用）を表示
4. ユーザーがTOTPアプリ（Google Authenticator等）でスキャン
5. ユーザーが生成された6桁コードを入力
6. Cognito verifySoftwareToken API → 検証
7a. 検証成功 → Cognito setUserMFAPreference（TOTP有効化）
7b. 検証失敗 → エラー表示、再入力を促す
8. POST /mfa/recovery-codes API → リカバリーコード10個を生成
9. リカバリーコードを表示し、安全に保管するよう案内
10. User.mfaEnabled = true に更新

MFA有効時のログイン:
1. ユーザーがメール＋パスワードを入力
2. Cognito signIn → SOFTWARE_TOKEN_MFA チャレンジ返却
3. MfaChallengePage に遷移
4. ユーザーが6桁TOTPコードを入力
5. Cognito confirmSignIn（TOTPコード）
6a. 成功 → トークン取得 → ホーム画面
6b. 失敗 → エラー表示、再入力を促す
6c. 「リカバリーコードを使用」→ リカバリーコード入力 → 検証 → ログイン

MFA無効化:
1. ユーザーが設定画面で「MFAを無効化」をタップ
2. 現在のTOTPコードまたはリカバリーコードの入力を要求
3. 検証成功 → Cognito setUserMFAPreference（TOTP無効化）
4. User.mfaEnabled = false に更新
5. リカバリーコードを無効化
```

---

## BL-08: Cognito Pre Sign-up Lambda Trigger（ブロックリスト照合）

```
トリガー: Cognito Pre Sign-up イベント
入力: event.request.userAttributes (email), event.request.password

1. パスワードを取得
2. ブロックリスト照合（3段階）:
   a. HaveIBeenPwned Passwords API（k-anonymity モデル）
      - パスワードの SHA-1 ハッシュの先頭5文字を送信
      - 返却されたハッシュリストと完全一致を確認
      - 一致 → 漏洩パスワードとして拒否
   b. カスタム辞書チェック
      - 一般的な辞書語（日本語・英語）との照合
      - サービス名（"sdlc", "sake", "sakenowa" 等）との照合
   c. コンテキスト固有チェック
      - ユーザーのメールアドレスのローカル部分との照合
      - メールドメインとの照合
3a. すべて合格 → event.response.autoConfirmUser = false（通常フロー続行）
3b. いずれか不合格 → 例外をスロー（Cognito がサインアップを拒否）
    - エラーメッセージ: 拒否理由を含む（BR-01-08）
    - 例: "このパスワードは漏洩リストに含まれています。より安全なパスワードを選択してください。"

注意事項:
- HaveIBeenPwned API 呼び出しはタイムアウト2秒。タイムアウト時はチェックをスキップ（可用性優先）
- Lambda のコールドスタート対策: Provisioned Concurrency を検討
- パスワード自体はログに記録しない（SECURITY-03準拠）
```


---

## BL-09: 開示レイヤー初期設定フロー

→ BL-06（POST /signup ハンドラーロジック）のステップ2 に統合済み。開示レイヤーの初期値算出ロジックは BL-06 を参照。

---

## BL-10: 開示レイヤー更新フロー（PUT /disclosure-level）

```
入力: { action: "unlock_category" | "unlock_all", category?: string }
認証: Cognito JWT から userId を抽出

action = "unlock_category" の場合:
1. category が有効な Layer 2 カテゴリ名か検証（type, region, temperature）。vessel・seasonal は Layer 3 項目のため unlock_category 対象外
2. Users テーブルから現在の unlockedCategories を取得
3. category が未解放の場合のみ追加（冪等性）
4. DynamoDB UpdateItem で unlockedCategories を更新
5. 成功レスポンス: 200 OK + 更新後の disclosureLevel, unlockedCategories

action = "unlock_all" の場合:
1. disclosureLevel を 3 に更新
2. unlockedCategories をクリア（全解放のため個別管理不要）
3. DynamoDB UpdateItem で disclosureLevel, unlockedCategories を更新
4. 成功レスポンス: 200 OK + 更新後の disclosureLevel

不変条件:
- disclosureLevel は増加のみ（BR-07-09）
- 既に disclosureLevel = 3 の場合は何もしない（冪等）
```
