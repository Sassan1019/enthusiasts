# 管理画面のセットアップ

## アクセス方法

管理画面URL: `/admin/contacts`

例: `https://your-domain.pages.dev/admin/contacts`

## デフォルトパスワード

**開発環境**:
- パスワード: `password`
- ⚠️ これはテスト用です。本番環境では必ず変更してください。

## パスワードの変更方法

### 1. 新しいパスワードのハッシュを生成

Linuxまたは macOS:
```bash
echo -n 'your-new-password' | sha256sum
```

または
```bash
echo -n 'your-new-password' | shasum -a 256
```

### 2. ローカル開発環境での設定

`.dev.vars` ファイルを編集:
```
ADMIN_PASSWORD_HASH=your-generated-hash-here
```

### 3. 本番環境（Cloudflare Pages）での設定

```bash
# プロジェクトディレクトリで実行
echo "your-generated-hash-here" | npx wrangler secret put ADMIN_PASSWORD_HASH
```

または Cloudflare ダッシュボードから:
1. Cloudflare Pages プロジェクトを開く
2. Settings → Environment Variables
3. `ADMIN_PASSWORD_HASH` を追加
4. 生成したハッシュ値を設定
5. 再デプロイ

## セキュリティのベストプラクティス

1. **強力なパスワードを使用**
   - 最低12文字以上
   - 大文字、小文字、数字、記号を組み合わせる

2. **定期的にパスワードを変更**
   - 3〜6ヶ月ごとに変更することを推奨

3. **パスワードを安全に保管**
   - パスワードマネージャーを使用
   - .dev.vars ファイルは絶対にGitにコミットしない（.gitignoreに含まれています）

4. **アクセスログの監視**
   - 不審なログイン試行がないか定期的に確認

## トラブルシューティング

### ログインできない

1. パスワードが正しいか確認
2. ブラウザのコンソールでエラーを確認
3. ハッシュ値が正しく設定されているか確認:
   ```bash
   # ローカル
   cat .dev.vars
   
   # 本番
   npx wrangler secret list
   ```

### パスワードをリセットしたい

1. 新しいハッシュを生成
2. 上記の「パスワードの変更方法」に従って設定
3. サーバーを再起動（ローカル環境の場合）

## 機能

- お問い合わせ一覧表示
- ステータス管理（新着、確認済み、返信済み）
- 統計情報の表示
- ログアウト機能

## サポート

問題が発生した場合は、開発者に連絡してください。
