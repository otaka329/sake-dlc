# SDLC — コンポーネント依存関係

---

## 依存関係マトリクス

| コンポーネント | AIGateway | SakenowaClient | AuthMiddleware | Logger | DynamoDB | Bedrock | S3 | Google Cal | Web Push | EventBridge |
|---|---|---|---|---|---|---|---|---|---|---|
| BE-02 Recommendation | ● | ● | ● | ● | ● | | | | | |
| BE-03 Pairing | ● | ● | ● | ● | | | | | | |
| BE-04 DrinkingLog | | ● | ● | ● | ● | | | | | |
| BE-05 TasteGraph | | ● | ● | ● | ● | | | | | |
| BE-06 Discovery | ● | ● | ● | ● | | | | | | |
| BE-07 Calendar | | | ● | ● | ● | | | ● | | |
| BE-08 Notification | | | ● | ● | ● | | | | ● | ● |
| BE-09 SakenowaSync | | ● | | ● | ● | | | | | ● |
| CM-01 AIGateway | | | | ● | | ● | ● | | | |
| CM-02 SakenowaClient | | | | ● | ● | | | | | |

● = 依存あり

---

## データフロー図

```
                    ┌─────────────────────────────────────────────┐
                    |              Frontend (React SPA)            |
                    |  ┌────────┐ ┌────────┐ ┌────────┐          |
                    |  | Auth   | | Plan   | | Build  | ...      |
                    |  └───┬────┘ └───┬────┘ └───┬────┘          |
                    └──────┼──────────┼──────────┼────────────────┘
                           |          |          |
                    ┌──────v──────────v──────────v────────────────┐
                    |           CloudFront + S3                    |
                    └──────────────────┬─────────────────────────┘
                                       |
                    ┌──────────────────v─────────────────────────┐
                    |         API Gateway (REST)                  |
                    |    Cognito Authorizer (JWT検証)              |
                    └──────────────────┬─────────────────────────┘
                                       |
              ┌────────────────────────┼────────────────────────┐
              |                        |                        |
    ┌─────────v──────┐    ┌───────────v────────┐    ┌─────────v──────┐
    | Lambda Handlers |    | Lambda Handlers    |    | Lambda Handlers|
    | (Recommend,     |    | (DrinkingLog,      |    | (Calendar,     |
    |  Pairing,       |    |  TasteGraph)       |    |  Notification) |
    |  Discovery)     |    |                    |    |                |
    └────────┬────────┘    └────────┬───────────┘    └────────┬──────┘
             |                      |                         |
    ┌────────v────────┐    ┌────────v───────────┐    ┌────────v──────┐
    |   AIGateway     |    |    DynamoDB        |    | Google Cal API|
    |   (CM-01)       |    |  ┌──────────────┐  |    | Web Push VAPID|
    └────────┬────────┘    |  | Users        |  |    | EventBridge   |
             |             |  | TasteProfiles|  |    └───────────────┘
    ┌────────v────────┐    |  | DrinkingLogs |  |
    | Bedrock Claude  |    |  | SakenowaCache|  |
    | (Text + Vision) |    |  | UserTokens   |  |
    └─────────────────┘    |  | Notification |  |
                           |  |  Settings    |  |
                           |  └──────────────┘  |
                           └────────────────────┘
             |
    ┌────────v────────┐
    | S3 (Prompts)    |
    └─────────────────┘

    ┌─────────────────┐
    | SakenowaClient  |──── さけのわAPI (外部)
    | (CM-02)         |     https://muro.sakenowa.com/sakenowa-data/api/
    └─────────────────┘
```

---

## 通信パターン

| パターン | 利用箇所 | 説明 |
|---|---|---|
| 同期 REST | FE → API Gateway → Lambda | ユーザーリクエストの処理 |
| 同期 SDK | Lambda → Bedrock | AI推論呼び出し |
| 同期 HTTP | Lambda → さけのわAPI | データ取得（キャッシュミス時のみ） |
| 同期 SDK | Lambda → DynamoDB | データ読み書き |
| 同期 OAuth | Lambda → Google Calendar API | 予定取得 |
| 非同期 Event | EventBridge → Lambda | さけのわデータ定期同期、通知スケジュール |
| Push | Web Push (VAPID) → PWA Service Worker | プッシュ通知 |

---

## レイヤー構成

```
┌─────────────────────────────────────────┐
| Presentation Layer (React SPA + PWA)    |
| - Feature Components (FE-01〜FE-09)     |
| - React Context (状態管理)               |
| - i18n (react-i18next)                  |
├─────────────────────────────────────────┤
| API Layer (API Gateway)                 |
| - REST Endpoints                        |
| - Cognito JWT Authorizer                |
| - Rate Limiting                         |
├─────────────────────────────────────────┤
| Business Logic Layer (Lambda Functions) |
| - Handler Functions (BE-01〜BE-09)       |
| - Service Orchestration (SVC-01〜SVC-08) |
├─────────────────────────────────────────┤
| Integration Layer                       |
| - AIGateway (CM-01) → Bedrock + S3     |
| - SakenowaClient (CM-02) → さけのわAPI  |
| - Google Calendar Client                |
├─────────────────────────────────────────┤
| Data Layer (DynamoDB)                   |
| - Users, TasteProfiles                  |
| - DrinkingLogs, SakenowaCache           |
| - UserTokens, NotificationSettings      |
├─────────────────────────────────────────┤
| Infrastructure Layer (Terraform)        |
| - API Gateway, Lambda, DynamoDB         |
| - S3, CloudFront, Cognito              |
| - EventBridge, Web Push (VAPID)          |
└─────────────────────────────────────────┘
```
