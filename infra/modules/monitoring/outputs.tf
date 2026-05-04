output "sns_topic_arn" {
  description = "アラート通知用 SNS トピック ARN"
  value       = aws_sns_topic.alerts.arn
}
