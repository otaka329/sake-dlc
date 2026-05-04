variable "env" {
  description = "環境名（dev / prod）"
  type        = string
}

variable "pre_signup_lambda_arn" {
  description = "Pre Sign-up Lambda Trigger の ARN"
  type        = string
}

variable "callback_urls" {
  description = "OAuth コールバック URL リスト"
  type        = list(string)
}

variable "logout_urls" {
  description = "ログアウト URL リスト"
  type        = list(string)
}
