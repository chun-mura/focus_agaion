# Focus Agaion Extension

YouTubeのサジェスト欄とショート動画を非表示にして、集中力を向上させるChrome拡張機能です。

## 機能

- **ホームページの推奨動画を非表示**: 集中力を妨げる推奨動画を隠します
- **ショート動画を非表示**: 短時間の動画に時間を取られないようにします
- **検索結果のショート動画を非表示**: 検索時にもショート動画を除外します
- **設定の即座反映**: 設定変更がYouTubeページに即座に反映されます

## 技術仕様

この拡張機能は**TypeScript**で開発されており、以下の特徴があります：

### アーキテクチャ
- **モジュラー設計**: 機能ごとにクラスとサービスに分離
- **型安全性**: TypeScriptによる厳密な型チェック
- **保守性**: 明確な責任分離とインターフェース定義

### ディレクトリ構造
```
src/
├── types/           # 型定義
├── services/        # ビジネスロジック
├── utils/           # ユーティリティ関数
├── constants/       # 定数
├── background/      # バックグラウンドスクリプト
├── content/         # コンテンツスクリプト
└── popup/           # ポップアップスクリプト
```

### 主要クラス
- `SettingsManager`: 設定の管理と永続化
- `YouTubeProcessor`: YouTubeページの処理と要素の非表示
- `PopupManager`: ポップアップUIの管理
- `BackgroundService`: バックグラウンド処理とメッセージ管理

## 開発環境のセットアップ

### 前提条件
- Node.js 18.12.0以上
- npm または yarn

### ローカル環境でのセットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. 開発用ビルド:
```bash
npm run build:dev
```

3. 本番用ビルド:
```bash
npm run build
```

4. ファイル監視モード:
```bash
npm run watch
```

5. 型チェック:
```bash
npm run type-check
```

### Docker環境でのセットアップ

Node.jsのバージョンが古い場合や、環境を統一したい場合は、Dockerを使用できます。

#### 方法1: Docker Compose（推奨）
```bash
# コンテナをビルドして起動
npm run docker:compose
```

#### 方法2: Docker直接実行
```bash
# イメージをビルド
npm run docker:build

# コンテナを実行
npm run docker:run
```

#### 方法3: 手動でDocker実行
```bash
# コンテナをビルド
docker build -t focus-agaion-extension .

# コンテナを実行（ファイル監視モード）
docker run -it --rm -v $(pwd):/app focus-agaion-extension

# または、一度だけビルド
docker run -it --rm -v $(pwd):/app focus-agaion-extension npm run build
```

## 使用方法

1. 拡張機能をビルドします
2. Chrome拡張機能の管理ページで「パッケージ化されていない拡張機能を読み込む」を選択
3. `dist`フォルダを選択
4. YouTubeページで拡張機能アイコンをクリックして設定

## 設定オプション

- **推奨動画を非表示**: ホームページの推奨動画を隠します
- **ショート動画を非表示**: ショート動画ページを無効化します
- **検索結果のショート動画を非表示**: 検索結果からショート動画を除外します

## ライセンス

ISC License

## 開発者向け情報

### ビルドプロセス
1. TypeScriptファイルをコンパイル
2. Webpackでバンドル化
3. 静的ファイルをdistフォルダにコピー

### デバッグ
- 開発者ツールのコンソールでログを確認
- ソースマップが生成されるため、TypeScriptコードでデバッグ可能

### テスト
現在は手動テストのみ対応。将来的にはJest等のテストフレームワークの導入を検討。

