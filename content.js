(function() {
    'use strict';

    let isInitialized = false;
    let observer = null;

    // 設定のデフォルト値
    const defaultSettings = {
        hideSuggestions: true,
        hideShorts: true,
        hideShortsInSearch: true
    };

    // 設定を取得
    async function getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(defaultSettings, (result) => {
                resolve(result);
            });
        });
    }

    // 要素を非表示にする関数
    function hideElement(element, reason = '') {
        if (element && !element.dataset.hiddenByExtension) {
            element.dataset.hiddenByExtension = reason;
            element.style.display = 'none';
            console.log(`YouTube Focus: 要素を非表示にしました - ${reason}`);
        }
    }

    // ホームページのサジェスト欄を非表示
    function hideHomePageSuggestions() {
        // メインの推奨動画グリッド
        const richGrid = document.querySelector('ytd-rich-grid-renderer');
        if (richGrid) {
            hideElement(richGrid, 'ホームページ推奨動画');
        }

        // 個別の動画アイテム
        const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
        videoItems.forEach(item => {
            hideElement(item, 'ホームページ動画アイテム');
        });

        // ショート動画セクション
        const shortsSection = document.querySelector('ytd-reel-shelf-renderer');
        if (shortsSection) {
            hideElement(shortsSection, 'ホームページショート動画');
        }
    }

    // 検索結果ページのショート動画を非表示
    function hideSearchResultsShorts() {
        // ショート動画の特定（shortsLockupViewModelHostクラスを使用）
        const shortsVideos = document.querySelectorAll('.shortsLockupViewModelHost');
        shortsVideos.forEach(video => {
            hideElement(video, '検索結果ショート動画');
        });

        // 代替的なショート動画検出
        const alternativeShorts = document.querySelectorAll('ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])');
        alternativeShorts.forEach(video => {
            hideElement(video, '検索結果ショート動画（代替検出）');
        });

        // ytd-reel-item-renderer（ショート動画専用レンダラー）
        const reelItems = document.querySelectorAll('ytd-reel-item-renderer');
        reelItems.forEach(item => {
            hideElement(item, '検索結果ショート動画（reel）');
        });

        // ショート動画セクション全体（タイトルを含む）
        const shortsSections = document.querySelectorAll('ytd-shelf-renderer');
        shortsSections.forEach(section => {
            const titleElement = section.querySelector('#title');
            if (titleElement && titleElement.textContent.includes('ショート')) {
                hideElement(section, '検索結果ショート動画セクション');
            }
        });

        // より包括的なショート動画検出
        const allShortsElements = document.querySelectorAll('ytd-shelf-renderer');
        allShortsElements.forEach(element => {
            const textContent = element.textContent || '';
            if (textContent.includes('ショート') || textContent.includes('Shorts')) {
                hideElement(element, '検索結果ショート動画（包括的検出）');
            }
        });
    }

    // 現在のページを処理
    async function processCurrentPage() {
        const settings = await getSettings();
        const path = window.location.pathname;

        if (path === '/' && settings.hideSuggestions) {
            // ホームページ
            hideHomePageSuggestions();
        } else if (path.includes('/results') && settings.hideShortsInSearch) {
            // 検索結果ページ
            hideSearchResultsShorts();
        } else if (path.includes('/shorts/') && settings.hideShorts) {
            // ショート動画ページ
            const shortsPlayer = document.querySelector('ytd-shorts-player');
            if (shortsPlayer) {
                hideElement(shortsPlayer, 'ショート動画ページ');
            }
        }
    }

    // MutationObserverの設定
    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 新しい要素が追加された場合
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // YouTubeの主要コンテンツ要素が追加されたかチェック
                            if (node.matches && (
                                node.matches('ytd-rich-grid-renderer') ||
                                node.matches('ytd-rich-item-renderer') ||
                                node.matches('ytd-reel-shelf-renderer') ||
                                node.matches('.shortsLockupViewModelHost') ||
                                node.matches('ytd-reel-item-renderer')
                            )) {
                                shouldProcess = true;
                                break;
                            }
                        }
                    }
                }
            });

            if (shouldProcess) {
                // 少し遅延させてから処理（DOMの完全な構築を待つ）
                setTimeout(processCurrentPage, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // イベントリスナーの設定
    function setupEventListeners() {
        // YouTubeのナビゲーションイベントを監視
        document.addEventListener('yt-navigate-start', () => {
            console.log('YouTube Focus: ページ遷移開始');
        });

        document.addEventListener('yt-navigate-finish', () => {
            console.log('YouTube Focus: ページ遷移完了');
            setTimeout(processCurrentPage, 500);
        });

        // URL変更の監視
        let currentUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('YouTube Focus: URL変更検出');
                setTimeout(processCurrentPage, 500);
            }
        });

        urlObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初期化関数
    async function initialize() {
        if (isInitialized) return;

        console.log('YouTube Focus: 拡張機能を初期化中...');

        // DOM準備完了を待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setupEventListeners();
                setupObserver();
                processCurrentPage();
                isInitialized = true;
                console.log('YouTube Focus: 初期化完了');
            });
        } else {
            setupEventListeners();
            setupObserver();
            processCurrentPage();
            isInitialized = true;
            console.log('YouTube Focus: 初期化完了');
        }
    }

    // メッセージリスナー（ポップアップからの設定変更に対応）
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSettings') {
            console.log('YouTube Focus: 設定更新を受信');
            processCurrentPage();
            sendResponse({ success: true });
        }
    });

    // 初期化開始
    initialize();
})();
