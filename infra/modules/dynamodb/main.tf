# DynamoDB モジュール — 5テーブル（ハイブリッド設計）

# Users テーブル（User + UserTokens）
resource "aws_dynamodb_table" "users" {
  name         = "sdlc-users-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "entityType"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "entityType"
    type = "S"
  }
  attribute {
    name = "email"
    type = "S"
  }

  # GSI1: email → userId（ソーシャルログイン紐付け用）
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    range_key       = "userId"
    projection_type = "KEYS_ONLY"
  }

  # SECURITY-01: 暗号化（AWS managed key）
  server_side_encryption {
    enabled = true
  }

  # RPO 5分以内
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# TasteProfiles テーブル
resource "aws_dynamodb_table" "taste_profiles" {
  name         = "sdlc-taste-profiles-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# DrinkingLogs テーブル
resource "aws_dynamodb_table" "drinking_logs" {
  name         = "sdlc-drinking-logs-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "logId"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "logId"
    type = "S"
  }
  attribute {
    name = "sakeId"
    type = "S"
  }
  attribute {
    name = "timestamp"
    type = "S"
  }

  # GSI1: 銘柄別検索
  global_secondary_index {
    name            = "sake-index"
    hash_key        = "sakeId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# SakenowaCache テーブル（グローバルキャッシュ、PITR 無効）
resource "aws_dynamodb_table" "sakenowa_cache" {
  name         = "sdlc-sakenowa-cache-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "dataType"

  attribute {
    name = "dataType"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  # キャッシュデータのため PITR 無効
  point_in_time_recovery {
    enabled = false
  }

  # TTL 有効（24h 自動期限切れ）
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}

# AppData テーブル（NotificationSettings + 設定系 + レート制限）
resource "aws_dynamodb_table" "app_data" {
  name         = "sdlc-app-data-${var.env}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "dataType"

  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "dataType"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  # TTL 有効（RATELIMIT エントリの自動削除）
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Project     = "sdlc"
    Environment = var.env
  }
}
