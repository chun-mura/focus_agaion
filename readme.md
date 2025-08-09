# YouTube Focus Extension

YouTubeのサジェスト欄とショート動画を非表示にして、集中力を向上させるChrome拡張機能です。

## 機能

- **ホームページの推奨動画を非表示**: YouTubeトップページの「あなたへのおすすめ」動画を非表示にします
- **ショート動画を非表示**: ショート動画ページ（/shorts/）を非表示にします
- **検索結果のショート動画を非表示**: 検索結果ページでショート動画を非表示にします
- **カスタマイズ可能な設定**: 各機能を個別に有効/無効にできます

## 技術仕様

- **Manifest V3**: 最新のChrome拡張機能標準に対応
- **Content Scripts**: YouTubeページでの動的要素制御
- **MutationObserver**: YouTubeのSPA特性に対応した動的監視
- **Chrome Storage API**: 設定の同期保存
- **Service Worker**: バックグラウンド処理

## セットアップ手順

### 1. 開発環境の準備

```bash
# プロジェクトディレクトリに移動
cd focus_agaion

# ファイル構造の確認
ls -la
```

### 2. Chrome拡張機能として読み込み

1. Chromeブラウザで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのディレクトリを選択

### 3. アイコンファイルの準備

`icons/` ディレクトリに以下のアイコンファイルを配置してください：
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

## 使用方法

1. Chrome拡張機能をインストール
2. YouTubeページにアクセス
3. 拡張機能アイコンをクリックして設定を調整
4. 設定を保存すると即座に反映されます

## ファイル構成

```
focus_agaion/
├── manifest.json          # 拡張機能設定
├── content.js            # メインコンテンツスクリプト
├── background.js         # サービスワーカー
├── styles.css           # YouTubeページ用スタイル
├── popup.html           # ポップアップUI
├── popup.css            # ポップアップスタイル
├── popup.js             # ポップアップ機能
├── icons/               # アイコンファイル
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── package.json         # プロジェクト設定
├── .gitignore          # Git除外設定
├── LICENSE             # ライセンス
└── README.md           # このファイル
```

## 開発者向け情報

### 主要な技術的実装

#### Content Script (content.js)
- YouTubeのDOM要素を動的に監視
- MutationObserverによる新しい要素の検出
- 設定に基づく要素の非表示化

#### Background Script (background.js)
- Service Workerとして動作
- 設定の管理と同期
- タブ間のメッセージング

#### ポップアップ (popup.js)
- 設定のUI管理
- Chrome Storage APIとの連携
- リアルタイム設定反映

### YouTube要素の特定方法

```javascript
// ホームページの推奨動画
const richGrid = document.querySelector('ytd-rich-grid-renderer');

// ショート動画（検索結果）
const shortsVideos = document.querySelectorAll('.shortsLockupViewModelHost');

// ショート動画ページ
const shortsPlayer = document.querySelector('ytd-shorts-player');
```

### 設定項目

- `hideSuggestions`: ホームページの推奨動画を非表示
- `hideShorts`: ショート動画ページを非表示
- `hideShortsInSearch`: 検索結果のショート動画を非表示

## 配布について

この拡張機能は配布を予定しています。Chrome Web Storeでの公開を目指して開発されています。

### 配布前の準備事項

1. **アイコンファイルの作成**: 各サイズのアイコンを準備
2. **プライバシーポリシー**: データ収集に関する説明
3. **利用規約**: 拡張機能の使用条件
4. **スクリーンショット**: Chrome Web Store用の画像

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

バグ報告や機能提案は歓迎します。プルリクエストも受け付けています。

## 更新履歴

- v1.0.0: 初期リリース
  - 基本的な要素非表示機能
  - 設定可能なUI
  - Manifest V3対応

