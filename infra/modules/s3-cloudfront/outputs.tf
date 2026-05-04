output "frontend_bucket_name" {
  description = "SPA ホスティング用 S3 バケット名（デプロイスクリプト参照用）"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID（キャッシュ無効化用）"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront ドメイン名（CORS 設定・コールバック URL 用）"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "logs_bucket_name" {
  description = "ログ保存用 S3 バケット名（CloudFront ログ + Cognito バックアップ）"
  value       = aws_s3_bucket.logs.bucket
}

output "logs_bucket_arn" {
  description = "ログ保存用 S3 バケット ARN（IAM ポリシー参照用）"
  value       = aws_s3_bucket.logs.arn
}
