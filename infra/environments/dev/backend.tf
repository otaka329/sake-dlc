terraform {
  required_version = ">= 1.9.0"

  backend "s3" {
    bucket         = "sdlc-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "sdlc-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"

  # 誤ったアカウントへの適用を防ぐガード。
  # 認証情報が別アカウントを指している場合、plan の段階で失敗する。
  allowed_account_ids = ["441713519216"]

  default_tags {
    tags = {
      Project     = "sdlc"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}
