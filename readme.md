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

## Chrome拡張の権限とセキュリティ

### 必要な権限とその理由

#### activeTab 権限
- **用途**: ユーザーが拡張機能アイコンをクリックした時に、現在アクティブなタブ（YouTubeページ）の情報を取得
- **具体的な処理**: ポップアップUIの表示判定、設定変更時のタブ識別
- **コード例**: `chrome.action.onClicked.addListener((tab) => { ... })`

#### storage 権限
- **用途**: ユーザーの設定（推奨動画の非表示、ショート動画の非表示など）の永続化
- **具体的な処理**: 設定の保存・取得、複数デバイス間での設定同期
- **コード例**: `chrome.storage.sync.set()`, `chrome.storage.sync.get()`

#### scripting 権限
- **用途**: YouTubeページへの動的コンテンツスクリプト注入、SPAナビゲーション対応
- **具体的な処理**: 動的コンテンツの監視、DOM変更のリアルタイム処理
- **コード例**: `MutationObserver`による要素変更の監視

#### ホスト権限（https://www.youtube.com/*）
- **用途**: YouTubeページでのみ拡張機能を動作させる
- **具体的な処理**: YouTube固有のDOM要素へのアクセス、ページ遷移イベントの監視
- **コード例**: `yt-navigate-finish`イベントの監視、YouTube固有セレクターの使用

### セキュリティ情報

#### リモートコードの使用
**いいえ、リモートコードは使用していません。**

#### セキュリティの特徴
- **完全オフライン動作**: 外部APIへの依存なし
- **ローカル処理**: すべての処理が拡張機能パッケージ内で完結
- **データ保護**: ユーザーデータの外部送信なし
- **安全なストレージ**: Chromeの標準API（`chrome.storage.sync`）のみ使用

#### プライバシー保護
- 個人情報の収集・送信なし
- 閲覧履歴の記録なし
- 外部サーバーとの通信なし
- 設定データのみをローカルに保存

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

## Chrome Web Storeでの公開

### 公開手順
1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)で開発者アカウント作成
2. 開発者登録料金（$5.00）を支払い
3. 「新しいアイテム」→「Chrome拡張機能」を選択
4. 本番ビルド（`dist`フォルダ）をZIP化してアップロード
5. ストアの詳細情報を入力して公開

### 必要な情報
- **拡張機能名**: "Focus Agaion Extension"
- **説明**: "YouTubeのサジェスト欄とショート動画を非表示にして、集中力を向上させる拡張機能"
- **カテゴリ**: "Productivity"（生産性）
- **言語**: 日本語
- **スクリーンショット**: 拡張機能の動作を示す画像
- **プロモーション画像**: 1280x800pxの画像

