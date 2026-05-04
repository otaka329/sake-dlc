variable "env" {
  default = "prod"
}

variable "sns_alert_email" {
  description = "アラート通知先メールアドレス"
  type        = string
}
