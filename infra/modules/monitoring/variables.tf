variable "env" {
  description = "環境名（dev / prod）"
  type        = string
}

variable "sns_alert_email" {
  description = "アラート通知先メールアドレス"
  type        = string
}

variable "api_name" {
  description = "API Gateway 名"
  type        = string
}
