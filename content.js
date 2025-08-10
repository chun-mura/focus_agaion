(function() {
    'use strict';

    let isInitialized = false;
    let observer = null;

    // 設定のデフォルト値
    const defaultSettings = {
        hideSuggestions: false,
        hideShorts: false,
        hideShortsInSearch: false
    };

    // Chrome APIが利用可能かチェックする関数
    function isChromeAPIAvailable() {
        return typeof chrome !== 'undefined' &&
                chrome.runtime &&
                chrome.storage &&
                chrome.storage.sync;
    }

    // 設定を取得
    async function getSettings() {
        return new Promise((resolve) => {
            if (!isChromeAPIAvailable()) {
                resolve(defaultSettings);
                return;
            }

            try {
                chrome.storage.sync.get(defaultSettings, (result) => {
                    if (chrome.runtime.lastError) {
                        resolve(defaultSettings);
                        return;
                    }
                    resolve(result || defaultSettings);
                });
            } catch (error) {
                resolve(defaultSettings);
            }
        });
    }

    // 要素を非表示にする関数
    function hideElement(element, reason = '') {
        if (element && !element.dataset.hiddenByExtension) {
            element.dataset.hiddenByExtension = reason;
            element.style.display = 'none';
        }
    }

    // 要素を再表示する関数
    function showElement(element) {
        if (element && element.dataset.hiddenByExtension) {
            delete element.dataset.hiddenByExtension;
            element.style.removeProperty('display');
        }
    }

    // 特定の理由で非表示にされた要素を再表示する関数
    function showElementsByReason(reason) {
        const hiddenElements = document.querySelectorAll(`[data-hidden-by-extension="${reason}"]`);
        hiddenElements.forEach(element => {
            showElement(element);
        });
    }

    // ショート動画かどうかを判定する関数
    function isShortsVideo(element) {
        return element.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') ||
               element.querySelector('.ytd-reel-item-renderer') ||
               element.closest('ytd-reel-shelf-renderer') ||
               element.querySelector('[aria-label*="ショート"]') ||
               element.querySelector('[aria-label*="Shorts"]');
    }

    // ホームページの推奨動画を非表示
    function hideHomePageSuggestions() {
        const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
        videoItems.forEach(item => {
            if (!isShortsVideo(item)) {
                hideElement(item, 'ホームページ推奨動画アイテム');
            }
        });
    }

    // ホームページのショート動画セクションを非表示
    function hideHomePageShorts() {
        const shortsSection = document.querySelector('ytd-reel-shelf-renderer');
        if (shortsSection) {
            hideElement(shortsSection, 'ホームページショート動画セクション');
        }

        const reelItems = document.querySelectorAll('ytd-reel-item-renderer');
        reelItems.forEach(item => {
            hideElement(item, 'ホームページショート動画レンダラー');
        });

        const shortsItems = document.querySelectorAll('ytd-rich-item-renderer');
        shortsItems.forEach(item => {
            if (isShortsVideo(item)) {
                hideElement(item, 'ホームページショート動画アイテム');
            }
        });
    }

    // 検索結果ページのショート動画を非表示
    function hideSearchResultsShorts() {
        const shortsVideos = document.querySelectorAll('.shortsLockupViewModelHost');
        shortsVideos.forEach(video => {
            hideElement(video, '検索結果ショート動画');
        });

        const alternativeShorts = document.querySelectorAll('ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])');
        alternativeShorts.forEach(video => {
            hideElement(video, '検索結果ショート動画（代替検出）');
        });

        const reelItems = document.querySelectorAll('ytd-reel-item-renderer');
        reelItems.forEach(item => {
            hideElement(item, '検索結果ショート動画（reel）');
        });

        const shortsSections = document.querySelectorAll('ytd-shelf-renderer');
        shortsSections.forEach(section => {
            const titleElement = section.querySelector('#title');
            if (titleElement && titleElement.textContent.includes('ショート')) {
                hideElement(section, '検索結果ショート動画セクション');
            }
        });
    }

    // ショート動画ページを非表示
    function hideShortsPage() {
        // 動画要素を停止
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            try {
                video.pause();
                video.muted = true;
                video.volume = 0;
                video.currentTime = 0;
            } catch (error) {
                // エラーは無視
            }
        });

        // ショート動画関連要素を非表示
        const shortsElements = [
            'ytd-shorts-player',
            '#shorts-inner-container',
            '.reel-video-in-sequence-new',
            'ytd-reel-video-renderer',
            '.experiment-overlay',
            '.action-container',
            '.metadata-container'
        ];

        shortsElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                hideElement(element, 'ショート動画要素');
            });
        });
    }

    // 現在のページを処理
    async function processCurrentPage() {
        try {
            const settings = await getSettings();
            const path = window.location.pathname;

            // 設定の状態に応じてCSSクラスを追加・削除
            document.body.classList.toggle('hide-suggestions-enabled', settings.hideSuggestions);
            document.body.classList.toggle('hide-shorts-enabled', settings.hideShorts);
            document.body.classList.toggle('hide-shorts-search-enabled', settings.hideShortsInSearch);

            // ホームページの処理
            if (path === '/') {
                if (settings.hideSuggestions) {
                    hideHomePageSuggestions();
                    hideHomePageShorts();
                } else {
                    showElementsByReason('ホームページ推奨動画アイテム');
                    showElementsByReason('ホームページショート動画セクション');
                    showElementsByReason('ホームページショート動画アイテム');
                    showElementsByReason('ホームページショート動画レンダラー');
                }
            }

            // 検索結果ページの処理
            if (path.includes('/results')) {
                if (settings.hideShortsInSearch) {
                    hideSearchResultsShorts();
                } else {
                    showElementsByReason('検索結果ショート動画');
                    showElementsByReason('検索結果ショート動画（代替検出）');
                    showElementsByReason('検索結果ショート動画（reel）');
                    showElementsByReason('検索結果ショート動画セクション');
                }
            }

            // ショート動画ページの処理
            if (path.includes('/shorts/')) {
                if (settings.hideShorts) {
                    hideShortsPage();
                } else {
                    showElementsByReason('ショート動画要素');
                }
            }

            console.log('Focus Agaion: ページ処理が完了しました', { path, settings });
        } catch (error) {
            console.warn('Focus Agaion: ページ処理中にエラーが発生しました:', error);
        }
    }

    // MutationObserverの設定
    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && node.matches) {
                            const selectors = [
                                'ytd-rich-grid-renderer',
                                'ytd-rich-item-renderer',
                                'ytd-reel-shelf-renderer',
                                '.shortsLockupViewModelHost',
                                'ytd-reel-item-renderer',
                                'ytd-shorts-player',
                                '#shorts-inner-container',
                                '.reel-video-in-sequence-new',
                                'ytd-reel-video-renderer'
                            ];

                            if (selectors.some(selector => node.matches(selector))) {
                                shouldProcess = true;
                                break;
                            }
                        }
                    }
                    if (shouldProcess) break;
                }
            }

            if (shouldProcess) {
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
        document.addEventListener('yt-navigate-finish', () => {
            setTimeout(processCurrentPage, 500);
        });

        // URL変更の監視
        let currentUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
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

        try {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setupEventListeners();
                    setupObserver();
                    processCurrentPage();
                    isInitialized = true;
                });
            } else {
                setupEventListeners();
                setupObserver();
                processCurrentPage();
                isInitialized = true;
            }
        } catch (error) {
            console.warn('初期化中にエラーが発生しました:', error);
            isInitialized = true;
        }
    }

    // メッセージリスナー
    if (isChromeAPIAvailable() && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'updateSettings') {
                // 設定変更を即座に反映
                setTimeout(() => {
                    processCurrentPage();
                }, 100);
                sendResponse({ success: true });
            }
        });
    }

    // 初期化開始
    initialize();
})();
