# Terraform バックエンド Bootstrap（初回のみ手動実行）
# S3 バケット + DynamoDB ロックテーブルを作成

terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

# Terraform 状態管理用 S3 バケット
resource "aws_s3_bucket" "terraform_state" {
  bucket = "sdlc-terraform-state"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Project = "sdlc"
    Purpose = "terraform-state"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# SECURITY-01: 暗号化（保存時）
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

# SECURITY-09: パブリックアクセスブロック
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Terraform ロック用 DynamoDB テーブル
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "sdlc-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Project = "sdlc"
    Purpose = "terraform-locks"
  }
}
