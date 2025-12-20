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
- [x] Hero セクション(メインメッセージ)
- [x] Philosophy セクション(理念・ビジョン・ミッション)
- [x] What We Do セクション(提供価値5項目)
- [x] Blog セクション(記事一覧表示)
- [x] D1データベースによるブログ機能
- [x] ブログAPI(`/api/posts`, `/api/posts/:slug`)
- [x] レスポンシブデザイン(モバイルファースト)
- [x] Google Fonts (Montserrat + Noto Sans JP)
- [x] スムーススクロール・アニメーション

### 🚧 未実装
- [ ] Member セクション(エンスーな人々の情報)
- [ ] ブログ記事管理画面(CRUD機能)
- [ ] 画像・ビジュアル素材の追加
- [ ] お問い合わせフォーム
- [ ] SEO最適化(OGP設定等)

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

1. **Member セクションの実装**: チームメンバーや関係者の情報を追加
2. **ブログ管理画面の構築**: 記事の作成・編集・削除機能を実装
3. **画像素材の追加**: Hero画像やセクション背景画像を配置
4. **お問い合わせフォームの実装**: Cloudflare Workers + 外部メールサービス連携
5. **SEO最適化**: OGP画像、meta description、structured dataの追加
6. **パフォーマンス最適化**: CDN設定、画像最適化、キャッシング戦略

## デプロイ状況

- **プラットフォーム**: Cloudflare Pages (未デプロイ)
- **ステータス**: ❌ 未デプロイ
- **最終更新**: 2024-12-20

## ライセンス

All rights reserved.
