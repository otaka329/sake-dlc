# Unit 2: AI Core — 監視アラーム
#
# 注意事項:
# - Powertools Metrics は service ディメンションを自動付与する。
#   デプロイ後にコンソールで実際のディメンション集合を確認し、必要に応じて dimensions を追加すること。
# - 率ベースのアラーム（エラー率、パース失敗率、キャッシュヒット率）は CloudWatch Metric Math が必要。
#   aws_cloudwatch_metric_alarm の metric_query で実装。
# - コスト警告は日次 EstimatedCost の30日 SUM で月次推定する。

# --- 1. AI 推論レイテンシ p95 > 5000ms ---
resource "aws_cloudwatch_metric_alarm" "ai_latency" {
  alarm_name          = "sdlc-ai-latency-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5000
  alarm_actions       = [aws_sns_topic.alerts.arn]
  namespace           = "SDLC/AIGateway"
  metric_name         = "LatencyMs"
  extended_statistic  = "p95"
  period              = 300

  tags = { Project = "sdlc", Environment = var.env }
}

# --- 2. コスト警告: 月次推定 > $40 ---
# EstimatedCost（per-call）を30日分加算して月次推定
resource "aws_cloudwatch_metric_alarm" "ai_cost_warning" {
  alarm_name          = "sdlc-ai-cost-warning-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  alarm_actions       = [aws_sns_topic.alerts.arn]

  # 日次 SUM > $1.33 で月次 $40 超過を近似検知（$40/30日 ≈ $1.33/日）
  namespace   = "SDLC/AIGateway"
  metric_name = "EstimatedCost"
  statistic   = "Sum"
  period      = 86400
  threshold   = 1.33

  tags = { Project = "sdlc", Environment = var.env }
}

# --- 3. パース失敗数 > 5（5分間、絶対件数） ---
# NOTE: 率ベース（>20%）にするには InvocationCount との Metric Math が必要。
# 初期は絶対件数で閾値を設定し、トラフィック増加時に rate に移行。
resource "aws_cloudwatch_metric_alarm" "ai_parse_failure" {
  alarm_name          = "sdlc-ai-parse-failure-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
  namespace           = "SDLC/AIGateway"
  metric_name         = "ParseFailureCount"
  statistic           = "Sum"
  period              = 300

  tags = { Project = "sdlc", Environment = var.env }
}

# --- 4. キャッシュヒット数が低い（1時間で < 5） ---
# NOTE: rate にするには CacheHitCount/(CacheHitCount+CacheMissCount) の Metric Math が必要。
# 初期は「1時間でヒット5件未満」で低ヒット率を近似検知。
resource "aws_cloudwatch_metric_alarm" "ai_cache_hit_low" {
  alarm_name          = "sdlc-ai-cache-hit-low-${var.env}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
  namespace           = "SDLC/AIGateway"
  metric_name         = "CacheHitCount"
  statistic           = "Sum"
  period              = 3600

  # dev 環境ではトラフィック少なく常時アラームになるため、
  # treat_missing_data で抑制
  treat_missing_data = "notBreaching"

  tags = { Project = "sdlc", Environment = var.env }
}

# --- 5. AI エラー数 > 5（5分間、絶対件数） ---
# NOTE: ErrorCount は cost-controller.ts から SDLC/AIGateway に送出される想定だが、
# 現状 create-handler.ts は SDLC/Foundation に送出。
# Unit 6 でメトリクス名前空間を整理する際に修正。初期は絶対件数で検知。
resource "aws_cloudwatch_metric_alarm" "ai_error_count" {
  alarm_name          = "sdlc-ai-error-count-${var.env}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  alarm_actions       = [aws_sns_topic.alerts.arn]
  namespace           = "SDLC/AIGateway"
  metric_name         = "ErrorCount"
  statistic           = "Sum"
  period              = 300

  treat_missing_data = "notBreaching"

  tags = { Project = "sdlc", Environment = var.env }
}
