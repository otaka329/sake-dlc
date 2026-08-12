variable "env" {
  description = "環境名（dev / prod）"
  type        = string
}

variable "users_table_arn" {
  type = string
}

variable "taste_profiles_table_arn" {
  type = string
}

variable "app_data_table_arn" {
  type = string
}

variable "cognito_user_pool_arn" {
  type = string
}

variable "backup_bucket_arn" {
  type = string
}

variable "log_retention_days" {
  description = "CloudWatch ログ保持日数（dev: 30, prod: 180）"
  type        = number
}

# Unit 2: AI Core 追加変数

variable "sakenowa_cache_table_arn" {
  description = "SakenowaCache テーブル ARN（AI ロールの GetItem 権限用）"
  type        = string
}

variable "app_data_table_name" {
  description = "AppData テーブル名（Lambda 環境変数用）"
  type        = string
}

variable "prompt_template_version" {
  description = "プロンプトテンプレートバージョン（Custom Resource の Update トリガー）"
  type        = string
  default     = "1"
}

variable "prompt_templates" {
  description = "プロンプトテンプレート定義リスト（Custom Resource に渡す JSON）"
  type = list(object({
    templateId  = string
    modelId     = string
    maxTokens   = number
    temperature = number
    variables   = list(string)
  }))
  default = []
}

variable "api_execution_arn" {
  description = "API Gateway execution ARN（Lambda permission の source_arn 用）"
  type        = string
}

variable "users_table_name" {
  description = "Users テーブル名（Lambda 環境変数用）"
  type        = string
}

variable "taste_profiles_table_name" {
  description = "TasteProfiles テーブル名（Lambda 環境変数用）"
  type        = string
}

variable "sakenowa_cache_table_name" {
  description = "SakenowaCache テーブル名（Lambda 環境変数用）"
  type        = string
}

variable "drinking_logs_table_name" {
  description = "DrinkingLogs テーブル名（Lambda 環境変数用）"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito ユーザープール ID（日次バックアップ Lambda 用）"
  type        = string
}

variable "backup_bucket_name" {
  description = "Cognito バックアップ先 S3 バケット名"
  type        = string
}
