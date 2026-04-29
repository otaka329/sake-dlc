# Unit 1: Foundation — ビジネスルール

---

## BR-01: ユーザー登録（メール＋パスワード）— NIST SP 800-63B §3.1.1 準拠

| ルールID | ルール | 根拠 |
|---|---|---|
| BR-01-01 | メールアドレスは有効な形式であること | RFC 5322準拠の形式バリデーション |
| BR-01-02 | 単一要素認証のパスワードは15文字以上であること（多要素認証の場合は8文字以上） | §3.1.1.2 SHALL require passwords ... to be a minimum of 15 characters in length |
| BR-01-03 | パスワードの最大長は64文字以上を許容すること | §3.1.1.2 SHOULD permit a maximum password length of at least 64 characters |
| BR-01-04 | 印刷可能なASCII文字、スペース、Unicode文字をパスワードに使用可能とすること。Unicodeの各コードポイントは1文字としてカウント | §3.1.1.2 SHOULD accept all printing ASCII characters and the space character / SHOULD accept Unicode characters |
| BR-01-05 | 文字種の混合ルール（大文字・小文字・数字・記号の組み合わせ等）を課さないこと | §3.1.1.2 SHALL NOT impose other composition rules |
| BR-01-06 | 定期的なパスワード変更を強制しないこと。漏洩の証拠がある場合のみ変更を強制 | §3.1.1.2 SHALL NOT require subscribers to change passwords periodically |
| BR-01-07 | パスワード設定時に、漏洩パスワードリスト・辞書語・サービス名やユーザー名の派生語を含むブロックリストと照合すること | §3.1.1.2 SHALL compare the prospective secret against a blocklist |
| BR-01-08 | ブロックリストに該当した場合、拒否理由を表示し、強いパスワードの選択を支援するガイダンスを提供すること | §3.1.1.2 SHALL provide the reason for rejection / SHALL offer guidance |
| BR-01-09 | パスワードヒント（作成方法のリマインダー）を未認証ユーザーに公開しないこと | §3.1.1.2 SHALL NOT permit the subscriber to store a hint |
| BR-01-10 | 秘密の質問（KBA）をパスワード選択時に使用しないこと | §3.1.1.2 SHALL NOT prompt subscribers to use KBA |
| BR-01-11 | パスワードは全文を入力させ、全文を検証すること（部分一致や切り捨てをしない） | §3.1.1.2 SHALL verify the entire submitted password |
| BR-01-12 | パスワード入力時に表示/非表示の切替オプションを提供すること | §3.1.1.2 SHOULD offer an option to display the password |
| BR-01-13 | パスワードマネージャーとオートフィル機能の使用を許可すること。ペースト機能も許可 | §3.1.1.2 SHALL allow the use of password managers and autofill functionality |
| BR-01-14 | ログイン試行回数を制限するレートリミットを実装すること | §3.1.1.2 SHALL implement a rate-limiting mechanism |
| BR-01-15 | パスワードはソルト付きハッシュで保存すること。ソルトは32ビット以上。適応型ハッシュアルゴリズム（bcrypt, Argon2等）を使用 | §3.1.1.2 SHALL be salted and hashed using a suitable password hashing scheme |
| BR-01-16 | Unicode文字を含むパスワードはハッシュ前にNFC正規化を適用すること | §3.1.1.2 SHOULD apply NFC normalization |
| BR-01-17 | 同一メールアドレスでの重複登録は不可 | Cognito側で制御 |
| BR-01-18 | メール確認が完了するまでアカウントは無効 | Cognito確認フロー |

### 実装メモ
- Cognito のパスワードポリシーは最小長のみ設定（15文字）。文字種混合ルールは無効化
- ブロックリストチェックはLambdaトリガー（Pre Sign-up）で実装
- ブロックリストソース: HaveIBeenPwned Passwords API（k-anonymity モデル）+ カスタム辞書
- パスワードハッシュはCognito内部で処理（bcrypt相当）

---

## BR-02: ソーシャルログイン

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-02-01 | Google/Apple OAuth認証が成功すること | OAuth 2.0フロー完了 |
| BR-02-02 | 既存メールアカウントとソーシャルアカウントの紐付けが可能 | 同一メールアドレスで検出時にリンク |
| BR-02-03 | 初回ソーシャルログイン時はプロファイル設定画面に遷移 | User.nickname が未設定の場合 |

---

## BR-02B: MFA（多要素認証）— NIST SP 800-63B AAL2 準拠

| ルールID | ルール | 根拠 |
|---|---|---|
| BR-02B-01 | MFAはユーザーが任意で有効化できること（Cognito MFA設定: Optional） | ユーザー体験を損なわない任意設定 |
| BR-02B-02 | MFA方式はTOTP（Time-based One-Time Password）のみサポート。SMSは非推奨のため不採用 | NIST §3.1.3 OOB via PSTN は制限あり。TOTPはSMSより安全 |
| BR-02B-03 | TOTP設定時にQRコードとシークレットキー（手動入力用）の両方を表示すること | Google Authenticator, Authy等の標準的なTOTPアプリに対応 |
| BR-02B-04 | TOTP設定完了前に、生成されたコードで検証を行うこと | 設定ミスの防止 |
| BR-02B-05 | MFA有効化時にリカバリーコード（10個）を発行し、安全に保管するよう案内すること | MFAデバイス紛失時のアカウント回復手段 |
| BR-02B-06 | リカバリーコードは各64ビット以上のランダム値で生成し、HMAC-SHA-256（鍵は KMS 管理）でハッシュ化して保存。各コードは1回のみ使用可能。高エントロピーのランダム値のため適応型ハッシュ（bcrypt）は不要 | NIST §4.2.1.1 Saved Recovery Codes |
| BR-02B-07 | MFA有効時、パスワード最小長を8文字に緩和可能 | NIST §3.1.1.2 multi-factor authentication の場合は8文字以上 |
| BR-02B-08 | MFA有効ユーザーのログイン時、パスワード認証成功後にTOTPコード入力を要求すること | AAL2: パスワード + TOTP の2要素 |
| BR-02B-09 | TOTPコードの有効期間は30秒。前後1ステップ（計90秒分）を許容すること | 時刻ずれへの対応 |
| BR-02B-10 | MFAの無効化には現在のTOTPコードまたはリカバリーコードの入力を要求すること | 不正な無効化の防止 |

### 実装メモ
- Cognito の Software Token MFA（TOTP）を使用
- Cognito MFA設定: `OPTIONAL`（ユーザーが設定画面から有効化）
- リカバリーコードはDynamoDB（Users テーブルの属性）にハッシュ化して保存
- フロントエンドでQRコード生成（qrcode ライブラリ）

---

## BR-03: 初期プロファイル設定

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-03-01 | ニックネームは2〜20文字であること | 文字数チェック |
| BR-03-02 | ニックネームに使用可能な文字: ひらがな、カタカナ、漢字、英数字、アンダースコア | 正規表現バリデーション |
| BR-03-03 | 言語設定は ja または en であること | enum バリデーション |
| BR-03-04 | 日本酒経験レベルは beginner, intermediate, advanced のいずれか | enum バリデーション |
| BR-03-05 | プロファイル設定完了後、TasteProfile を初期値で作成 | 6軸すべて0.5（中央値）で初期化 |

---

## BR-04: 言語切替

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-04-01 | 初回アクセス時はブラウザの Accept-Language ヘッダーから言語を自動判定 | ja* → ja、それ以外 → en |
| BR-04-02 | 言語切替はUI全体に即時反映 | react-i18next の言語切替 |
| BR-04-03 | 言語設定はサーバー側（User.locale）とローカル（localStorage）の両方に保存 | API PUT + localStorage |

---

## BR-05: PWA

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-05-01 | Web App Manifest が正しく設定されていること | name, short_name, icons, start_url, display: standalone |
| BR-05-02 | Service Worker がインストールされること | Workbox による SW 登録 |
| BR-05-03 | オフライン時はキャッシュされたデータを表示 | Cache-first 戦略（静的アセット）、Network-first 戦略（API） |
| BR-05-04 | オンライン復帰時にバックグラウンド同期 | Background Sync API |

---

## BR-06: 認証状態管理

| ルールID | ルール | 検証条件 |
|---|---|---|
| BR-06-01 | 未認証ユーザーはログイン/登録画面のみアクセス可能 | ルートガード（ProtectedRoute） |
| BR-06-02 | トークン有効期限切れ時は自動リフレッシュ | refreshToken による自動更新 |
| BR-06-03 | リフレッシュトークンも期限切れの場合はログイン画面にリダイレクト | 401レスポンス時の処理 |
| BR-06-04 | ログアウト時はすべてのトークンを無効化 | Cognito globalSignOut + ローカルストレージクリア |
