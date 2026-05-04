# SDLC — ストーリー × ユニット マッピング

---

## マッピング一覧

| ストーリー | タイトル | 優先度 | ユニット |
|---|---|---|---|
| US-01 | ユーザー登録（メール＋パスワード） | Must | Unit 1 Foundation |
| US-02 | ソーシャルログイン（Google/Apple） | Must | Unit 1 Foundation |
| US-02B | MFA（多要素認証）設定 | Should | Unit 1 Foundation |
| US-03 | 言語設定 | Must | Unit 1 Foundation |
| US-04 | 体調・予定の入力 | Must | Unit 2 AI Core |
| US-05 | Google Calendar連携 | Must | Unit 5 External |
| US-06 | 料理の入力（テキスト） | Must | Unit 2 AI Core |
| US-07 | 料理の入力（画像アップロード） | Must | Unit 3 Pairing |
| US-08 | AI日本酒推薦 | Must | Unit 2 AI Core |
| US-09 | Don't Deploy Today判定 | Must | Unit 2 AI Core |
| US-10 | ノンアル代替提案 | Should | Unit 2 AI Core |
| US-11 | 推薦結果のカスタマイズ | Should | Unit 2 AI Core |
| US-12 | ペアリング提案（テキスト） | Must | Unit 3 Pairing |
| US-13 | ペアリング提案（画像） | Must | Unit 3 Pairing |
| US-14 | Deploy（飲む）の記録 | Must | Unit 4 Lifecycle |
| US-15 | Skip Deploy（飲まない）の記録 | Must | Unit 4 Lifecycle |
| US-16 | メタ応答 | Should | Unit 2 AI Core |
| US-17 | 翌朝の状態記録 | Should | Unit 4 Lifecycle |
| US-18 | 飲酒終了時刻の通知 | Must | Unit 5 External |
| US-19 | 味覚プロファイルの表示 | Must | Unit 4 Lifecycle |
| US-20 | 飲酒/非飲酒履歴の表示 | Must | Unit 4 Lifecycle |
| US-21 | 嗜好に基づく新銘柄の発見 | Should | Unit 4 Lifecycle |
| US-22 | 地域別酒蔵ブラウジング | Should | Unit 3 Pairing |
| US-23 | 銘柄詳細・フレーバー情報 | Should | Unit 3 Pairing |
| US-24 | 製法・文化の学習コンテンツ | Could | Unit 3 Pairing |
| US-25 | ホーム画面への追加 | Must | Unit 1 Foundation |
| US-26 | オフライン対応 | Should | Unit 1 Foundation |
| US-27 | プッシュ通知設定 | Should | Unit 5 External |
| US-28 | 開示レイヤーの自動解放 | Must | Unit 4 Lifecycle |
| US-29 | 開示レイヤーに応じた表示切替 | Must | Unit 1 Foundation |
| US-30 | オンボーディングでの経験レベル選択 | Should | Unit 1 Foundation |

---

## ユニット別サマリー

| ユニット | Must | Should | Could | 合計 |
|---|---|---|---|---|
| Unit 1 Foundation | 5 | 3 | 0 | 8 |
| Unit 2 AI Core | 4 | 3 | 0 | 7 |
| Unit 3 Pairing & Discovery | 3 | 2 | 1 | 6 |
| Unit 4 Lifecycle Tracking | 5 | 2 | 0 | 7 |
| Unit 5 External Integration | 2 | 1 | 0 | 3 |
| Unit 6 Infrastructure | 0 | 0 | 0 | 0 |
| **合計** | **19** | **11** | **1** | **31** |

---

## 未割り当てストーリー確認
全31ストーリーがユニットに割り当て済み。未割り当てなし。
