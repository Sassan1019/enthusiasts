# 才能を覚醒させる - Corporate LP

個人事業主としての実績・ポートフォリオとなる高品質なコーポレートLP。

## プロジェクト概要

- **名称**: 才能を覚醒させる
- **目的**: 個人事業主として案件受注するための実績・ポートフォリオ
- **理念**: 才能を覚醒させる
- **ビジョン**: 出逢った人の才能の機会損失をゼロにする
- **ミッション**: 才能の化学反応を起こし続ける

## 主な機能

### ✅ 完了済み
- [x] ミニマルで洗練されたLPデザイン
- [x] Hero セクション(大胆な英語タイポグラフィ + 背景画像)
- [x] Philosophy セクション(理念・ビジョン・ミッション / グリッドレイアウト)
- [x] What We Do セクション(提供価値6項目: 1on1コーチング、コミュニティ運営、イベント開催、プロデュース、プロジェクト立ち上げ支援、マッチング)
- [x] Blog セクション(記事一覧表示 + スライドショー)
  - [x] 最新3記事のスライドショー(自動再生・手動操作)
  - [x] 前後ボタンとドットナビゲーション
  - [x] 手動操作時の自動再生停止機能
- [x] noteとの連携(RSS取得)
  - [x] noteのRSSフィードから記事を自動取得
  - [x] noteバッジ表示と外部リンク対応
  - [x] サムネイル画像の取得と表示
  - [x] 手動同期API (`POST /api/sync-note`)
- [x] Member セクション(メンバー5名の詳細プロフィール + 未来メンバー枠)
  - [x] メンバーモーダル機能(名前・理念クリックで詳細表示)
  - [x] SNSリンク機能(Instagram、X)
- [x] Achievements セクション(実績表示)
- [x] CTA Banner セクション(JOIN US + BLOG)
- [x] D1データベースによるブログ機能
- [x] ブログAPI(`/api/posts`, `/api/posts/:slug`, `/api/sync-note`)
- [x] レスポンシブデザイン(モバイルファースト)
- [x] Google Fonts (Montserrat + Noto Sans JP)
- [x] スムーススクロール・アニメーション
- [x] Enthusiastsロゴ配置(ヘッダー・フッター / 背景透過版)
- [x] ナビゲーションメニュー実装
- [x] crossfields.jp風の統一デザイン(英語見出し + 日本語サブタイトル)
- [x] 控えめで上品なブログセクションデザイン

### 🚧 未実装
- [ ] ブログ記事管理画面(CRUD機能)
- [ ] お問い合わせフォーム
- [ ] SEO最適化(OGP設定等)
- [ ] 本番環境へのデプロイ

## 公開URL

- **開発環境**: https://3000-iyllxbz2ece1fe06f94oc-82b888ba.sandbox.novita.ai
- **本番環境**: 未デプロイ

## APIエンドポイント

| エンドポイント | メソッド | 説明 |
|------------|---------|-----|
| `/api/posts` | GET | 公開済み記事一覧を取得(内部記事 + note記事) |
| `/api/posts/:slug` | GET | 特定記事の詳細を取得 |
| `/api/sync-note` | POST | noteのRSSフィードから記事を同期(手動実行) |

## データ構造

### Posts テーブル
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published BOOLEAN DEFAULT 0,
  source TEXT DEFAULT 'internal',           -- 'internal' or 'note'
  external_url TEXT,                       -- noteの場合は外部URL
  thumbnail_url TEXT,                      -- サムネイル画像URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## メンバー紹介

### 佐々木 慧 - Project Leader
- **理念**: 原石に光を
- **専門分野**: ファイナンス・経営戦略・プロデュース・考察
- **背景**: 元日本一のレーサーを父に持つ元レーサー。夢を失った後、IT業界での成功を目指し上京。用意された成功を辞退し、才能の機会損失をゼロにするプロジェクトを立ち上げる。
- **SNS**: 
  - Instagram: https://www.instagram.com/sasaki.1019/
  - X: https://x.com/Cat_badminton

### 布野 雅也 - Core Member
- **理念**: Find Your Why .
- **専門分野**: マーケティング・PR・プロデュース
- **ビジョン**: 今を生きる人があふれる世界
- **背景**: 「島根の陸上を強くする」その志を胸に、高校時代は絶対王者の25連覇を阻むジャイアントキリングを達成し、チームを初の全国へ導いた。その後、都内の強豪大学へ進むも、怪我により志半ばで引退。「走る」という生きがいを失いかけたが、陸上イベントの主催・プロデュースという新たな道に出逢う。そこで「人々が熱狂する瞬間」を生み出す喜びに目覚めた。就職活動では「自分の人生を自分の足で歩みたい」という想いから、複数の内定をすべて辞退。現在は佐々木と共に、自己実現へ向けた新たな一歩を踏み出している。

### 黒岩 礼生 - Core Member
- **理念**: 人々に眠る愛おしさを照らし出す
- **専門分野**: シークレット
- **活動**: 食・健康・自己受容をテーマにコーチング。「ありがとう」が飛び交う日本を目指す。

### 甘糟 里奈 - Member
- **理念**: 感性で世界を彩る
- **専門分野**: PR
- **背景**: 3000冊以上の読書で培った独自の感性。栃木県さくら市で地域おこし協力隊として活動中。

### 當内 脩平 - Member
- **理念**: Make Your Rock
- **専門分野**: PR・イベントプロデュース
- **実績**: 大阪天王寺で音楽フェス「STAR'Z DASH!!」を主催

## デザインベンチマーク

- **makers-u.jp**: ミニマル・洗練・余白の使い方
- **crossfields.jp**: 大胆な英語タイポグラフィ・統一デザイン・実績表示

## 技術スタック

- **フレームワーク**: Hono (v4.11.1)
- **ランタイム**: Cloudflare Workers/Pages
- **データベース**: Cloudflare D1 (SQLite)
- **スタイリング**: Tailwind CSS (CDN)
- **フォント**: Google Fonts (Montserrat, Noto Sans JP)
- **ビルドツール**: Vite
- **デプロイ**: Cloudflare Pages

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# ローカル開発サーバー起動(サンドボックス環境)
npm run build
pm2 start ecosystem.config.cjs

# データベースマイグレーション
npm run db:migrate:local

# シードデータ投入
npm run db:seed

# データベースリセット
npm run db:reset

# ポート3000のクリーンアップ
npm run clean-port

# 接続テスト
npm run test

# 本番デプロイ
npm run deploy
```

## 推奨される次のステップ

1. **ブログ管理画面の構築**: 記事の作成・編集・削除機能を実装
2. **お問い合わせフォームの実装**: Cloudflare Workers + 外部メールサービス連携
3. **SEO最適化**: OGP画像、meta description、structured dataの追加
4. **パフォーマンス最適化**: CDN設定、画像最適化、キャッシング戦略
5. **本番デプロイ**: Cloudflare Pagesへのデプロイと独自ドメイン設定

## デプロイ状況

- **プラットフォーム**: Cloudflare Pages (未デプロイ)
- **ステータス**: ❌ 未デプロイ
- **最終更新**: 2025-12-20

## ライセンス

All rights reserved.
