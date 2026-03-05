# 打刻ちゃん

Discord 上で出退勤を打刻できるシンプルな Bot です。

## 機能

| コマンド | 説明 |
|---|---|
| `/touch` | 打刻します。直前の状態に応じて出勤・退勤を自動判定します。 |
| `/touch_fix` | 過去の打刻の理由を修正します。オートコンプリートで打刻を選択できます。 |
| `/worktime` | 今日・今週・先週・今月の勤務時間レポートを表示します。 |

## セットアップ

### 必要なもの

- Node.js 24 以降
- pnpm

### インストール

```sh
pnpm install
```

### 環境変数

`.env` ファイルをプロジェクトルートに作成し、以下の変数を設定してください。

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
# データ保存先ディレクトリ (省略時: ./data)
# DATA_DIR=./data
```

| 変数名 | 必須 | 説明 |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Discord Bot のトークン |
| `DISCORD_CLIENT_ID` | ✅ | Discord アプリケーション ID |
| `DATA_DIR` | | 打刻データの保存先ディレクトリ (デフォルト: `./data`) |

### ビルドと起動

```sh
# ビルド
pnpm build

# 起動
pnpm start
```

起動後、Bot がオンラインになると同時にグローバルスラッシュコマンドが自動登録されます。

### 型チェック

```sh
pnpm typecheck
```

## データ

打刻データは `DATA_DIR` (デフォルト: `./data/users.json`) に JSON 形式で保存されます。
データはユーザーごとに管理され、各打刻には ID・種別・タイムスタンプ・理由が記録されます。
