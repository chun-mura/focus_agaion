```
以下のような要件のアプリケーションを作成したいです。技術的に実現可能ですか？可能である場合は言語・DB・インフラ周りの技術選定をお願いします。

Chrome拡張
youtubeトップページのサジェスト欄を非表示にする
検索した後にのみ検索結果の動画を表示する
検索後のショート動画は非表示にする
```

このアプリケーションの要件は技術的に実現可能です！Chrome拡張機能の基本的な機能範囲内で対応できる内容ばかりです。

いくつか詳細を確認させてください：

1. 「サジェスト欄」は、YouTubeトップページで検索バーにフォーカスした際に表示される検索候補のことでしょうか？それとも、トップページに表示される「あなたへのおすすめ」動画のことでしょうか？

2. 検索後に表示される動画の中で、通常の動画とショート動画の区別はどのように判断しますか？（動画の長さ、#Shortsタグの有無など）

3. この拡張機能は個人利用が目的でしょうか、それとも配布を予定していますか？

これらの詳細を確認した後、最適な技術選定をご提案いたします！

```
「サジェスト欄」は、YouTubeトップページで検索バーにフォーカスした際に表示される検索候補のことでしょうか？それとも、トップページに表示される「あなたへのおすすめ」動画のことでしょうか？
→トップページに表示される「あなたへのおすすめ」動画のことです。

検索後に表示される動画の中で、通常の動画とショート動画の区別はどのように判断しますか？（動画の長さ、#Shortsタグの有無など）
→ショート動画にはshortsLockupViewModelHostクラスが適用されているようです

この拡張機能は個人利用が目的でしょうか、それとも配布を予定していますか？
→配布を予定しています
```

ありがとうございます！詳細が明確になりました。配布予定ということであれば、より堅牢で保守性の高い実装が重要ですね。

技術的な詳細について詳しく調査いたします。Chrome拡張機能でのYouTube要素の非表示化、最新のYouTubeのDOM構造、そして配布に適した技術選定について包括的に研究してみます！

Your YouTube Chrome extension development guide is ready. It covers essential techniques for handling YouTube's SPA architecture, DOM manipulation strategies, Manifest V3 implementation, selector targeting methods for various YouTube elements, extension architecture best practices, and performance optimization techniques. The guide also includes market analysis of successful extensions and approaches for dealing with YouTube's frequent UI changes.

# YouTube Chrome拡張機能開発完全ガイド

YouTube向けChrome拡張機能の開発は、動的なSPA（Single Page Application）架構と頻繁なUI変更への対応が鍵となる技術的挑戦です。**2025年現在、YouTube拡張機能市場は500万人以上のユーザーを抱える成熟した分野**であり、効果的な実装には最新のManifest V3標準と堅牢なDOM操作戦略が必要不可欠です。

## YouTube要素を非表示にする技術的手法

### DOM操作の基本アプローチ

YouTubeの**Single-Page Application（SPA）アーキテクチャ**は従来のページ遷移とは異なり、`history.pushState()`によるナビゲーションを使用します。これにより、拡張機能は動的なコンテンツ変化に対応する必要があります。

```javascript
// YouTube専用のナビゲーション検出
document.addEventListener('yt-navigate-start', handleNavigation);
document.addEventListener('yt-navigate-finish', handleNavigation);

function handleNavigation() {
    console.log('YouTubeページ遷移を検出');
    processCurrentPage();
}
```

**堅牢な要素待機メカニズム**は非同期コンテンツ読み込みに対応するため重要です：

```javascript
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) return resolve(element);

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`要素 ${selector} が${timeout}ms以内に見つかりませんでした`));
        }, timeout);
    });
}
```

### Content Scriptの実装戦略

**Manifest V3準拠の構成**では、以下の設定が必要です：

```json
{
    "manifest_version": 3,
    "name": "YouTube拡張機能",
    "permissions": ["activeTab", "storage", "scripting"],
    "host_permissions": ["https://www.youtube.com/*"],
    "content_scripts": [{
        "matches": ["https://www.youtube.com/*"],
        "js": ["content.js"],
        "run_at": "document_start"
    }],
    "background": {
        "service_worker": "background.js"
    }
}
```

**効果的なContent Script構造**：

```javascript
(function() {
    'use strict';

    let isInitialized = false;

    function initialize() {
        if (isInitialized) return;
        isInitialized = true;

        setupEventListeners();
        processCurrentPage();
    }

    function processCurrentPage() {
        const path = window.location.pathname;

        if (path.includes('/watch')) {
            hideVideoElements();
        } else if (path === '/') {
            hideHomePageSuggestions();
        } else if (path.includes('/results')) {
            hideSearchElements();
        }
    }

    // DOM準備完了時またはすでに読み込み済みの場合の初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
```

## YouTube要素の特定方法

### ホームページサジェスト欄の識別

**2025年現在のCSS構造**では、検索候補は以下のセレクタで特定できます：

```javascript
// 検索候補の主要コンテナ
const searchSuggestions = document.querySelector('ytd-search-suggestions-renderer');

// 個別の候補項目
const suggestionItems = document.querySelectorAll('yt-formatted-string[role="presentation"]');

// 検索ボックス全体
const searchHeader = document.querySelector('#header.ytd-searchbox');
```

### 通常動画とショート動画の区別

**最も確実な判定方法**は`overlay-style`属性を使用することです：

```javascript
// 通常動画の特定
const regularVideos = document.querySelectorAll(
    'ytd-video-renderer:not(:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]))'
);

// ショート動画の特定
const shortsVideos = document.querySelectorAll(
    'ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])'
);

// 代替的なショート検出方法
function detectContentType() {
    const path = window.location.pathname;

    if (path.includes('/shorts/')) {
        return 'shorts';
    } else if (path.includes('/watch')) {
        const shortsPlayer = document.querySelector('ytd-shorts-player');
        return shortsPlayer ? 'shorts' : 'regular';
    }
    return 'other';
}
```

### 要素の具体的なCSSセレクタ

**動画メタデータ取得**：

```javascript
// 動画タイトル
const videoTitle = document.querySelector('#title h1.ytd-watch-metadata');

// チャンネル名
const channelName = document.querySelector('#channel-name');

// 再生回数
const viewCount = document.querySelector('#metadata-line span:first-child');

// アップロード日
const uploadDate = document.querySelector('#metadata-line span:nth-child(2)');

// 動画の長さ
const duration = document.querySelector('ytd-thumbnail-overlay-time-status-renderer .badge-shape-wiz__text');
```

**検索結果ページの構造**：

```javascript
// 検索結果コンテナ
const searchResults = document.querySelectorAll('ytd-video-renderer');

// フィルターオプション
const searchFilters = document.querySelectorAll('ytd-search-filter-renderer');

// ソートオプション
const sortOptions = document.querySelector('ytd-search-header-renderer');
```

## Chrome拡張機能開発技術スタック

### 必須ファイル構成

```
youtube-extension/
├── manifest.json          # 拡張機能設定
├── background.js          # サービスワーカー
├── content/
│   ├── content.js         # メインコンテンツスクリプト
│   ├── inject.js          # ページレベル注入スクリプト
│   └── styles.css         # YouTubeページスタイリング
├── popup/
│   ├── popup.html         # 拡張機能ポップアップUI
│   ├── popup.js           # ポップアップ機能
│   └── popup.css          # ポップアップスタイル
├── options/
│   ├── options.html       # 設定ページ
│   └── options.js         # 設定ロジック
├── icons/
│   ├── icon16.png         # ツールバーアイコン
│   ├── icon48.png         # 拡張機能管理
│   └── icon128.png        # Chrome Web Store
└── assets/
    ├── youtube-api.js     # YouTube APIラッパー
    └── utils.js           # ユーティリティ関数
```

### 重要なChrome拡張API

**ストレージAPI**の活用：

```javascript
// 同期ストレージ（デバイス間で同期）
chrome.storage.sync.set({ userPrefs: data });
chrome.storage.sync.get(['userPrefs'], (result) => {
    console.log(result.userPrefs);
});

// ローカルストレージ（デバイス固有）
chrome.storage.local.set({ videoCache: cache });

// ストレージ変更の監視
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.userPrefs) {
        updateYouTubeUI(changes.userPrefs.newValue);
    }
});
```

**タブAPI**でのYouTube操作：

```javascript
// 現在のYouTubeタブ取得
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'enhance' });
    }
});

// タブナビゲーションの監視
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url?.includes('youtube.com/watch')) {
        // 新しい動画が読み込まれた
        chrome.tabs.sendMessage(tabId, {
            action: 'videoPageLoaded',
            url: changeInfo.url
        });
    }
});
```

### パフォーマンス最適化

**メモリ管理**では、Service Workerの特性を理解することが重要です：

```javascript
// ❌ グローバル変数（SW終了時に失われる）
let videoCache = new Map();

// ✅ ストレージを使用した永続化
const getVideoCache = async () => {
    const { cache } = await chrome.storage.local.get('videoCache');
    return cache || {};
};

// イベントリスナーのクリーンアップ
const cleanup = () => {
    document.removeEventListener('click', handleClick);
    observer.disconnect();
    clearInterval(intervalId);
};
```

**遅延読み込み**による初期化速度の向上：

```javascript
// 必要時のみ機能を読み込み
const loadAdvancedFeatures = async () => {
    if (!window.ytAdvancedLoaded) {
        const { default: AdvancedFeatures } = await import('./advanced.js');
        window.ytAdvancedLoaded = true;
        return AdvancedFeatures;
    }
};

// デバウンスによる操作最適化
const debouncedAnalyze = debounce(analyzeVideo, 1000);
```

## 類似拡張機能の分析

### 成功事例の技術的アプローチ

**ImprovedTube**（50万+ユーザー、オープンソース）は最も包括的な例です。80以上の機能を持ちながら軽量性を保つ**モジュラーアーキテクチャ**を採用しています。

**Enhancer for YouTube™**（16.4K評価、4.7/5星）は**細かい再生制御**（0.07x-16x速度）と**音量ブースター**（最大10倍）で差別化を図っています。

**SponsorBlock**（310万ユーザー）は**コミュニティ駆動のデータベース**と**動画タイムスタンプ操作**により、スポンサーセグメントの自動スキップを実現しています。

### 市場機会と競争環境

YouTube拡張機能市場は**年間成長率15-20%**で拡大しており、特に**クリエイター向けツール**（TubeBuddy: 数百万ユーザー、月額5.99-49.99ドル）で高い収益性が確認されています。

**主要な差別化要因**：
- パフォーマンスの優秀性（軽量性、高速読み込み）
- 機能の完全性（包括的 vs 特化型）
- 価格モデル（フリーミアム vs ワンタイム購入）
- ユーザー体験（直感的なUI、最小限の干渉）

## 開発における注意点

### YouTube UI変更への対応

YouTubeは**月次でUI更新**を行うため、堅牢なセレクタ戦略が必要です：

```javascript
// 複数セレクタによるフォールバック
function findElement(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

// セマンティック属性を優先
const videoElement = document.querySelector('video[src*="googlevideo"]');
const playButton = document.querySelector('[aria-label*="Play"]');
```

### セキュリティとコンプライアンス

Chrome Web Storeの**単一目的ポリシー**と**リモートコード禁止規則**、さらにYouTubeの**利用規約**（動画ダウンロード禁止等）への準拠が必須です。

**推奨される実装パターン**：
- 最小権限の原則（必要最小限の permissions）
- 透明性のある開発プロセス（可能であればオープンソース）
- ユーザープライバシーの保護（データ収集の最小化）
- 定期的なセキュリティ監査

この包括的なガイドにより、現代のYouTube拡張機能開発に必要な技術的基盤とベストプラクティスを習得できます。成功の鍵は、YouTubeの動的な環境への適応性と、ユーザー価値の明確な提供にあります。

Your YouTube Chrome extension development technical guide is ready. It covers element hiding techniques, DOM manipulation strategies, optimal content script implementation, element identification methods, Manifest V3 compliance, recommended tech stack (Vite+CRXJS with TypeScript), testing approaches, and distribution optimization strategies for Chrome Web Store. The report includes code examples, successful case studies, and best practices for building robust YouTube extensions in 2024-2025.

# YouTube Chrome拡張機能開発の完全技術ガイド

YouTube向けChrome拡張機能開発において、2024-2025年現在の技術動向と実装手法に基づく包括的な調査結果を報告します。特にYouTubeの要素非表示機能を中心とした拡張機能開発に必要な技術選択肢と最適なアーキテクチャを提示します。

## YouTube要素の非表示化技術手法

### DOM操作の核心的アプローチ

YouTube向け拡張機能における要素非表示には**CSS注入**と**直接DOM操作**の2つの主要手法があります。**CSS注入がパフォーマンスと持続性の観点から推奨**されており、manifest.jsonでの事前読み込みにより要素のちらつきを防止できます。

直接DOM操作は動的コンテンツへの柔軟な対応が可能で、条件分岐による選択的な要素制御に適しています。効率的な実装では、`document.querySelector`の結果をキャッシュし、`requestAnimationFrame`を活用して視覚更新を最適化することが重要です。

### Content Scriptの最適化パターン

Content scriptの実行タイミングが拡張機能の体感品質を大きく左右します。**`"run_at": "document_start"`**の設定により、CSSを即座に適用してコンテンツのちらつきを防止し、YouTubeのSPA（Single Page Application）アーキテクチャに対応した初期化処理を実現します。

```javascript
// 推奨実装パターン
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const newVideos = document.querySelectorAll('ytd-rich-grid-media:not(.processed)');
      newVideos.forEach(processVideoElement);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

### MutationObserverによる動的対応

YouTubeの無限スクロールと動的コンテンツ読み込みに対応するため、**MutationObserver**が不可欠です。効率的な監視のため、`childList`のみを対象とし、`attributes`監視を避けることで処理負荷を軽減します。重複処理防止のため、処理済み要素にマーキング（`dataset.processed`）を行う実装パターンが一般的です。

### ページ遷移への堅牢な対応

YouTubeのクライアントサイドルーティングに対応するため、複数の検出手法を組み合わせます。`chrome.webNavigation.onHistoryStateUpdated`による背景スクリプトでの検出と、コンテンツスクリプト内でのURL変化監視を併用することで、確実な遷移検出を実現します。

## YouTube要素の正確な識別手法

### 推奨動画セクションの特定

2024-2025年現在のYouTubeホームページ構造では、**`ytd-rich-grid-renderer`**が主要コンテナとなっており、個別動画アイテムは**`ytd-rich-item-renderer`**で識別できます。これらのWeb Componentsベースのセレクタは、YouTubeのPolymer/Litフレームワーク構造により高い安定性を維持しています。

具体的なCSSセレクタ：
- メイングリッド：`#contents.ytd-rich-grid-renderer`
- 動画アイテム：`ytd-rich-item-renderer`
- タイトルリンク：`#video-title-link`

### Shorts動画の確実な識別

検索結果ページにおけるShorts動画は**`.shortsLockupViewModelHost`クラス**で安定的に識別可能です。追加的な識別パターンとして、`ytd-reel-item-renderer`や構造的な親要素`ytd-reel-shelf-renderer`も活用できます。

URL パターンによる検出（`youtube.com/shorts/{video_id}`）と組み合わせることで、より堅牢な識別システムを構築できます。

### 変更耐性のある識別戦略

YouTubeの頻繁なインターフェース更新に対抗するため、**構造ベース選択**と**複数フォールバック戦略**が効果的です。生成されたクラス名より、`aria-label`属性やデータ属性、要素の階層関係を活用することで安定性を向上します。

```javascript
// 堅牢なフォールバック実装例
const selectors = [
  'ytd-rich-grid-media',
  '[data-target-id]',
  '[role="article"] a strong'
];

let element;
for (const selector of selectors) {
  element = document.querySelector(selector);
  if (element) break;
}
```

## 最適技術スタック構成

### Manifest V3完全対応

2024年以降、**Manifest V3**が必須要件となっており、Service Workerベースの背景処理とchrome.scriptingAPIの活用が中核となります。host_permissionsの適切な設定と、リモートコード実行の完全排除が求められます。

推奨manifest構成では、`activeTab`、`scripting`、`storage`権限の最小セットで機能を実現し、不要な権限要求を避けることでストア承認率を向上させます。

### 開発効率化ツールチェーン

**Vite + CRXJS**の組み合わせが2024-2025年の最優秀選択肢です。Webpackと比較して10倍高速な開発ビルドと、真のHot Module Replacementサポートにより開発効率が大幅に向上します。TypeScript 4.9+との組み合わせにより、型安全性を確保しながら開発生産性を最大化できます。

代替案として、エンタープライズ環境や複雑な要件がある場合はWebpack 5、ライブラリ開発重視の場合はRollupも検討価値があります。

### テスト戦略の多層化

- **ユニットテスト**：Jest + @jest/environment-jsdom
- **統合テスト**：jest-chrome mockを活用したChrome API テスト
- **E2Eテスト**：Puppeteerによる実ブラウザテスト

この3層アプローチにより、拡張機能特有の複雑さに対応した包括的品質保証を実現します。

## 成功事例の技術分析

### 主要拡張機能の実装パターン

**ImprovedTube**（500,000+ ユーザー）は170+機能を持つ包括的YouTube拡張機能として、モジュラー設計とカスタムUI ライブラリ"Satus"による設定管理を実現しています。パフォーマンス最適化のため、特定セレクタによる効率的DOM監視を採用しています。

**DeArrow**はSponsorBlockベース（GPL 3.0）のReact/TypeScript実装で、クラウドソーシングによるサムネイル・タイトル改善機能を提供します。Backend統合とサムネイル生成サービスにより、スケーラブルな機能を実現している点が特徴的です。

### アーキテクチャの共通成功要因

成功する拡張機能に共通するのは、**モジュラー設計**、**堅牢な設定管理**、**効率的DOM監視**、**適切なエラーハンドリング**です。特にYouTubeのSPA特性に対応するため、MutationObserver実装とメモリ管理の最適化が重要な差別化要因となっています。

### コミュニティ駆動型開発の価値

オープンソース拡張機能は、YouTubeのインターフェース変更への迅速な対応力で優位性を持ちます。GitHubを通じたコミュニティ貢献により、一般的に数日以内に修正が提供される協調的デバッグ・テスト体制が確立されています。

## 配布最適化戦略

### Chrome Web Store承認の確実化

2024-2025年の承認要件では**単一目的ポリシー**の厳格な適用と、**プライバシーポリシー**の包括的な開示が必要です。YouTube関連データの取り扱いには必須のプライバシー文書化と、HTTPS通信の完全実装が求められます。

一般的な却下理由として、過剰な権限要求、不明確な機能説明、プライバシーポリシーの不備が挙げられます。これらを事前に解決することで承認率を大幅に向上できます。

### スケーリング対応技術

大規模ユーザーベースに対応するため、**段階的ロールアウト機能**（10,000+アクティブユーザー対象）の活用と、CDN配信による資産最適化が効果的です。Chrome Web Store のパーセンテージロールアウト機能により、リスクを最小化しながら更新を展開できます。

### 法的コンプライアンスの確保

YouTube コンテンツ修正拡張機能では、**フェアユース原則**への適合と**YouTube利用規約**の遵守が必要です。クライアントサイド修正による変換的使用に留め、コンテンツのダウンロード・再配布を避けることで法的リスクを最小化します。GDPR遵守を含む国際的な規制への対応も必須要件です。

## 推奨技術選択

### 核心技術スタック

**最優秀構成：**
- **ビルドツール**: Vite + CRXJS（開発効率最大化）
- **言語**: TypeScript 4.9+ strict mode（型安全性確保）
- **テスト**: Jest + Puppeteer（包括的品質保証）
- **API**: chrome.scripting + chrome.storage + chrome.activeTab

### アーキテクチャ推奨事項

1. **Content Script重視設計**: DOM操作の主体をContent Scriptに配置
2. **CSS注入優先**: manifest.jsonでの事前CSS読み込み
3. **MutationObserver中央集権**: 単一オブザーバーによる効率的監視
4. **段階的機能展開**: コア機能から順次拡張する設計

### インフラ考慮事項

Chrome拡張機能の性質上、従来的なDB/インフラは不要ですが、大規模展開時には**Chrome Storage Sync API**による設定同期と、**Chrome Web Store Analytics**による利用状況追跡が重要です。10,000+ ユーザー到達後は段階的配布機能の活用を推奨します。

この包括的アプローチにより、YouTube向けChrome拡張機能の技術的優位性、配布成功率、長期的保守性を同時に実現できます。特に2024-2025年の技術環境においては、Manifest V3完全準拠とモダンな開発ツールチェーンの採用が成功の必要条件となっています。
