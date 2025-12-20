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
- [x] What We Do セクション(提供価値5項目)
- [x] Blog セクション(記事一覧表示)
- [x] Member セクション(メンバー5名の詳細プロフィール + 未来メンバー枠)
- [x] Achievements セクション(実績表示)
- [x] CTA Banner セクション(JOIN US + BLOG)
- [x] D1データベースによるブログ機能
- [x] ブログAPI(`/api/posts`, `/api/posts/:slug`)
- [x] レスポンシブデザイン(モバイルファースト)
- [x] Google Fonts (Montserrat + Noto Sans JP)
- [x] スムーススクロール・アニメーション
- [x] Enthusiastsロゴ配置(ヘッダー・フッター)
- [x] ナビゲーションメニュー実装
- [x] crossfields.jp風の統一デザイン(英語見出し + 日本語サブタイトル)

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
| `/api/posts` | GET | 公開済み記事一覧を取得 |
| `/api/posts/:slug` | GET | 特定記事の詳細を取得 |

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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## メンバー紹介

### 佐々木 慧 - Project Leader
- **理念**: 原石に光を
- **専門分野**: ファイナンス・経営戦略・プロデュース・考察
- **背景**: 元日本一のレーサーを父に持つ元レーサー。夢を失った後、IT業界での成功を目指し上京。用意された成功を辞退し、才能の機会損失をゼロにするプロジェクトを立ち上げる。

### 布野 雅也 - Core Member
- **理念**: Find Your Why .
- **専門分野**: マーケティング・PR・プロデュース
- **ビジョン**: 今を生きる人があふれる世界

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
- **最終更新**: 2024-12-20

## ライセンス

All rights reserved.
