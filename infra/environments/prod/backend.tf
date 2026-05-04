terraform {
  required_version = ">= 1.9.0"

  backend "s3" {
    bucket         = "sdlc-terraform-state"
    key            = "prod/terraform.tfstate"
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

  default_tags {
    tags = {
      Project     = "sdlc"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}
