# Unit 1: Foundation — インフラコードサマリー

## Terraform モジュール一覧

| モジュール | ファイル | リソース数 |
|---|---|---|
| backend-setup | infra/backend-setup/main.tf | 4（S3 バケット + 暗号化 + パブリックブロック + DynamoDB ロック） |
| cognito | infra/modules/cognito/ | 4（User Pool, App Client, Domain, IdP は後日追加） |
| dynamodb | infra/modules/dynamodb/ | 5テーブル（Users, TasteProfiles, DrinkingLogs, SakenowaCache, AppData） |
| api-gateway | infra/modules/api-gateway/ | 12（REST API, Authorizer, Stage, Method Settings, Log Group, Deployment, Gateway Response 7種） |
| s3-cloudfront | infra/modules/s3-cloudfront/ | 10（SPA バケット + 暗号化 + パブリックブロック + バージョニング + ログバケット + ライフサイクル + OAC + Headers Policy + Distribution + バケットポリシー） |
| lambda-base | infra/modules/lambda-base/ | 14（Layer, IAM ロール 4個 + ポリシー, ロググループ 10個） |
| monitoring | infra/modules/monitoring/ | 7（SNS トピック + サブスクリプション + アラーム 5種） |

## 環境別設定

| 環境 | ディレクトリ | ファイル |
|---|---|---|
| dev | infra/environments/dev/ | main.tf, variables.tf, backend.tf, terraform.tfvars.example |
| prod | infra/environments/prod/ | main.tf, variables.tf, backend.tf, terraform.tfvars.example |

## ⚠️ CodePipeline / CodeBuild モジュールは Unit 6 (Infrastructure) で作成
