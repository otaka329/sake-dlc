# 監視モジュール
# CloudWatch アラーム 5種, SNS トピック, X-Ray 設定

# SNS トピック
resource "aws_sns_topic" "alerts" {
  name = "sdlc-alerts-${var.env}"

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.sns_alert_email
}

# アラーム 1: API Gateway 5xx エラー率 > 5%（5分間）
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "sdlc-5xx-error-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 0.05
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ApiName = var.api_name
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# アラーム 2: Lambda エラー率 > 10%（5分間）
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "sdlc-lambda-error-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# アラーム 3: DynamoDB スロットル > 0（5分間）
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "sdlc-dynamodb-throttle-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# アラーム 4: DLQ メッセージ数 > 0
# ⚠️ DLQ（SQS キュー）リソースは Unit 6 (Infrastructure) で作成。
# 作成後に dimensions.QueueName を設定すること。
# 現状は dimensions なし（全 SQS キューの集計値）のため、DLQ 作成前は無効化推奨。
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "sdlc-dlq-messages-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_actions       = [aws_sns_topic.alerts.arn]

  # TODO: Unit 6 で DLQ 作成後に追加
  # dimensions = {
  #   QueueName = "sdlc-dlq-${var.env}"
  # }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# アラーム 5: HibpTimeout 頻発 > 5（5分間）
resource "aws_cloudwatch_metric_alarm" "hibp_timeout" {
  alarm_name          = "sdlc-hibp-timeout-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HibpTimeoutCount"
  namespace           = "SDLC/Foundation"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}
