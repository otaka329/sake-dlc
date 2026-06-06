# AI-DLC State Tracking

## Project Information
- **Project Name**: SDLC — Sake Driven Life Cycle
- **Project Type**: Greenfield
- **Start Date**: 2026-04-28T00:00:00Z
- **Current Stage**: Unit 2 AI Core — Infrastructure Design 完了（承認済み）
- **Next Stage**: Unit 2 AI Core — Code Generation

## Workspace State
- **Existing Code**: No
- **Reverse Engineering Needed**: No
- **Workspace Root**: /workspace

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Extension Configuration
| Extension | Enabled | Mode | Decided At |
|---|---|---|---|
| Security Baseline | Yes | Full (SECURITY-01〜15) | Requirements Analysis |
| Property-Based Testing | Yes | Full (PBT-01〜10) | Requirements Analysis |

## Execution Plan Summary
- **Total Stages**: 12（INCEPTION 6 + CONSTRUCTION 6）
- **Stages to Execute**: Functional Design, NFR Requirements, NFR Design, Infrastructure Design, Code Generation, Build and Test
- **Stages Completed**: Workspace Detection, Requirements Analysis, User Stories, Workflow Planning, Application Design, Units Generation
- **Stages to Skip**: Reverse Engineering（グリーンフィールド）

## Stage Progress

### 🔵 INCEPTION PHASE
- [x] Workspace Detection
- [x] Requirements Analysis
- [x] User Stories
- [x] Workflow Planning
- [x] Application Design - EXECUTE
- [x] Units Generation - EXECUTE

### 🟢 CONSTRUCTION PHASE (per-unit)
- [x] Functional Design - Unit 1 Foundation
- [x] Functional Design - Unit 2 AI Core
- [ ] Functional Design - Unit 3〜6
- [x] NFR Requirements - Unit 1 Foundation
- [x] NFR Design - Unit 1 Foundation
- [x] Infrastructure Design - Unit 1 Foundation
- [x] Code Generation - Unit 1 Foundation
- [x] Build and Test - EXECUTE

### 🟡 OPERATIONS PHASE
- [ ] Operations - PLACEHOLDER

## Current Status
- **Lifecycle Phase**: CONSTRUCTION
- **Current Stage**: Unit 2 AI Core — Infrastructure Design（完了・承認済み）
- **Next Stage**: Unit 2 AI Core — Code Generation
- **Status**: Unit 1 Foundation 全完了。Unit 2 AI Core は Functional Design + NFR Requirements + NFR Design + Infrastructure Design 完了。次は Code Generation。

## 次回確認事項（後続ユニット引き継ぎ）

### Unit 6 Infrastructure 着手時
1. **KMS env var 配線** — `aws_lambda_function` 追加時に `environment.variables.KMS_RECOVERY_CODES_KEY_ID = module.lambda_base.recovery_codes_kms_key_id` を必ず接続。忘れると recovery-codes / delete-mfa Lambda がコールドスタート時に起動失敗（fail-fast 実装済み）

### Unit 2 AI Core 着手時
2. **サーバ側ブロックリスト実装** — `backend/src/lib/password-blocklist.ts` を Custom Auth Challenge または Pre Auth Trigger で配線。Cognito SDK 統合のタイミングで対応（BR-01-07 サーバーサイド多層防御）
3. **MFA 削除フロー正規化** — `delete-mfa.ts` の VerifySoftwareToken 流用は暫定。Cognito SDK 統合時に AdminInitiateAuth → AdminRespondToAuthChallenge の正規フローへ移行
4. **localStorage → HttpOnly Cookie 移行** — `logical-components.md` に明記済み。Cognito SDK 統合時に併せて実施。XSS 暴露面の最小化
