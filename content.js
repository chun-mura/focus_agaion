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
        try {
            // 基本的なChrome APIの存在チェック
            if (typeof chrome === 'undefined') {
                return false;
            }

            // runtime APIの存在チェック
            if (!chrome.runtime) {
                return false;
            }

            // storage APIの存在チェック
            if (!chrome.storage || !chrome.storage.sync) {
                return false;
            }

            // runtime.lastErrorの安全なチェック
            try {
                // lastErrorが存在するかどうかをチェック（アクセスはしない）
                if (chrome.runtime.lastError !== undefined) {
                    // lastErrorが存在する場合は、エラーがないかチェック
                    return !chrome.runtime.lastError;
                }
                return true;
            } catch (lastErrorCheck) {
                // lastErrorのチェックでエラーが発生した場合は、APIが利用可能とみなす
                return true;
            }
        } catch (error) {
            console.warn('Chrome API利用可能性チェック中にエラーが発生しました:', error);
            return false;
        }
    }

    // 設定を取得
    async function getSettings() {
        return new Promise((resolve) => {
            console.log('YouTube Focus: 設定取得開始');

            // chrome APIが利用可能かチェック
            if (!isChromeAPIAvailable()) {
                console.warn('chrome.storageが利用できません。デフォルト設定を使用します。');
                console.log('YouTube Focus: デフォルト設定を使用:', defaultSettings);
                resolve(defaultSettings);
                return;
            }

            // エラーハンドリング付きでストレージから取得
            const handleStorageResult = (result) => {
                try {
                    console.log('YouTube Focus: ストレージから取得した結果:', result);

                    // chrome.runtime.lastErrorを安全にチェック
                    let hasError = false;
                    try {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            const error = chrome.runtime.lastError;
                            console.warn('設定の取得に失敗しました:', error);
                            hasError = true;
                        }
                    } catch (lastErrorCheck) {
                        console.warn('lastErrorチェック中にエラーが発生しました:', lastErrorCheck);
                        hasError = true;
                    }

                    if (hasError) {
                        console.log('YouTube Focus: エラーのためデフォルト設定を使用:', defaultSettings);
                        resolve(defaultSettings);
                    } else {
                        // 結果が存在しない場合や、必要なプロパティが存在しない場合はデフォルト設定を使用
                        const settings = result || {};
                        const finalSettings = {
                            hideSuggestions: settings.hideSuggestions !== undefined ? settings.hideSuggestions : defaultSettings.hideSuggestions,
                            hideShorts: settings.hideShorts !== undefined ? settings.hideShorts : defaultSettings.hideShorts,
                            hideShortsInSearch: settings.hideShortsInSearch !== undefined ? settings.hideShortsInSearch : defaultSettings.hideShortsInSearch
                        };
                        console.log('YouTube Focus: 最終設定:', finalSettings);
                        resolve(finalSettings);
                    }
                } catch (error) {
                    console.warn('設定の取得中にエラーが発生しました:', error);
                    console.log('YouTube Focus: エラーのためデフォルト設定を使用:', defaultSettings);
                    resolve(defaultSettings);
                }
            };

            // ストレージから取得を試行（エラーハンドリング付き）
            try {
                // chrome.storage.sync.getの呼び出しを安全にラップ
                if (typeof chrome.storage.sync.get === 'function') {
                    console.log('YouTube Focus: chrome.storage.sync.getを呼び出し中...');
                    chrome.storage.sync.get(defaultSettings, handleStorageResult);
                } else {
                    console.warn('chrome.storage.sync.getが利用できません。デフォルト設定を使用します。');
                    console.log('YouTube Focus: デフォルト設定を使用:', defaultSettings);
                    resolve(defaultSettings);
                }
            } catch (error) {
                console.warn('設定の取得中にエラーが発生しました:', error);
                console.log('YouTube Focus: エラーのためデフォルト設定を使用:', defaultSettings);
                resolve(defaultSettings);
            }
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

    // 要素を再表示する関数
    function showElement(element) {
        if (element && element.dataset.hiddenByExtension) {
            const reason = element.dataset.hiddenByExtension;
            console.log(`YouTube Focus: 要素を再表示中 - ${reason}`, element);
            delete element.dataset.hiddenByExtension;
            // 元の表示状態を復元（display: noneを削除）
            element.style.removeProperty('display');
            console.log(`YouTube Focus: 要素を再表示しました - ${reason}`, element);
        } else if (element && element.style.display === 'none') {
            console.log(`YouTube Focus: 要素がdisplay: noneで非表示になっているため再表示中...`, element);
            element.style.removeProperty('display');
            console.log(`YouTube Focus: 要素を再表示しました`, element);
        } else if (element) {
            console.log(`YouTube Focus: 要素は既に表示されています`, element);
        } else {
            console.log(`YouTube Focus: 要素が無効です`);
        }
    }

    // 特定の理由で非表示にされた要素を再表示する関数
    function showElementsByReason(reason) {
        const hiddenElements = document.querySelectorAll(`[data-hidden-by-extension="${reason}"]`);
        console.log(`YouTube Focus: ${reason} で非表示にされた要素を検索中...`, hiddenElements.length, '個見つかりました');
        hiddenElements.forEach(element => {
            showElement(element);
        });

        // 追加: display: noneが設定されている要素も検索して再表示
        const allElements = document.querySelectorAll('*');
        let displayNoneCount = 0;
        allElements.forEach(element => {
            if (element.style.display === 'none' && element.dataset.hiddenByExtension === reason) {
                console.log(`YouTube Focus: ${reason} でdisplay: noneが設定されている要素を発見:`, element);
                showElement(element);
                displayNoneCount++;
            }
        });
        if (displayNoneCount > 0) {
            console.log(`YouTube Focus: ${reason} でdisplay: noneが設定されていた要素を${displayNoneCount}個再表示しました`);
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

    // ホームページのサジェスト欄を再表示
    function showHomePageSuggestions() {
        console.log('YouTube Focus: ホームページの推奨動画を再表示中...');

        // まず、data-hidden-by-extension属性を持つ要素を検索して再表示
        showElementsByReason('ホームページ推奨動画');
        showElementsByReason('ホームページ動画アイテム');
        showElementsByReason('ホームページショート動画');

        // 追加: 直接要素を検索して再表示
        const richGrid = document.querySelector('ytd-rich-grid-renderer');
        if (richGrid) {
            console.log('YouTube Focus: richGrid要素を発見:', richGrid);
            if (richGrid.dataset.hiddenByExtension) {
                console.log('YouTube Focus: richGrid要素を再表示中...');
                showElement(richGrid);
            } else if (richGrid.style.display === 'none') {
                console.log('YouTube Focus: richGrid要素がdisplay: noneで非表示になっているため再表示中...');
                richGrid.style.removeProperty('display');
                console.log('YouTube Focus: richGrid要素を再表示しました');
            } else {
                console.log('YouTube Focus: richGrid要素は既に表示されています');
            }
        } else {
            console.log('YouTube Focus: richGrid要素が見つかりません');
        }

        const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
        console.log('YouTube Focus: 動画アイテム要素を発見:', videoItems.length, '個');
        videoItems.forEach((item, index) => {
            if (item.dataset.hiddenByExtension) {
                console.log(`YouTube Focus: 動画アイテム${index}を再表示中...`);
                showElement(item);
            } else if (item.style.display === 'none') {
                console.log(`YouTube Focus: 動画アイテム${index}がdisplay: noneで非表示になっているため再表示中...`);
                item.style.removeProperty('display');
                console.log(`YouTube Focus: 動画アイテム${index}を再表示しました`);
            }
        });

        const shortsSection = document.querySelector('ytd-reel-shelf-renderer');
        if (shortsSection) {
            console.log('YouTube Focus: shortsSection要素を発見:', shortsSection);
            if (shortsSection.dataset.hiddenByExtension) {
                console.log('YouTube Focus: shortsSection要素を再表示中...');
                showElement(shortsSection);
            } else if (shortsSection.style.display === 'none') {
                console.log('YouTube Focus: shortsSection要素がdisplay: noneで非表示になっているため再表示中...');
                shortsSection.style.removeProperty('display');
                console.log('YouTube Focus: shortsSection要素を再表示しました');
            } else {
                console.log('YouTube Focus: shortsSection要素は既に表示されています');
            }
        } else {
            console.log('YouTube Focus: shortsSection要素が見つかりません');
        }

        console.log('YouTube Focus: ホームページの推奨動画の再表示完了');
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

    // 検索結果ページのショート動画を再表示
    function showSearchResultsShorts() {
        showElementsByReason('検索結果ショート動画');
        showElementsByReason('検索結果ショート動画（代替検出）');
        showElementsByReason('検索結果ショート動画（reel）');
        showElementsByReason('検索結果ショート動画セクション');
        showElementsByReason('検索結果ショート動画（包括的検出）');
    }

    // ショート動画ページを非表示
    function hideShortsPage() {
        const shortsPlayer = document.querySelector('ytd-shorts-player');
        if (shortsPlayer) {
            hideElement(shortsPlayer, 'ショート動画ページ');
        }
    }

    // ショート動画ページを再表示
    function showShortsPage() {
        showElementsByReason('ショート動画ページ');
    }

    // 現在のページを処理
    async function processCurrentPage() {
        try {
            console.log('YouTube Focus: ページ処理開始');
            const settings = await getSettings();
            const path = window.location.pathname;

            console.log('YouTube Focus: ページ処理開始', { path, settings });

            // 設定の状態に応じてCSSクラスを追加・削除
            if (settings.hideSuggestions || settings.hideShorts || settings.hideShortsInSearch) {
                document.body.classList.add('youtube-focus-enabled');
                document.body.classList.remove('youtube-focus-disabled');
            } else {
                document.body.classList.add('youtube-focus-disabled');
                document.body.classList.remove('youtube-focus-enabled');
            }

            if (path === '/') {
                // ホームページ
                console.log('YouTube Focus: ホームページを処理中...');
                if (settings.hideSuggestions) {
                    console.log('YouTube Focus: ホームページの推奨動画を非表示にします');
                    hideHomePageSuggestions();
                } else {
                    console.log('YouTube Focus: ホームページの推奨動画設定がオフのため、処理をスキップします');
                }
            } else if (path.includes('/results')) {
                // 検索結果ページ
                console.log('YouTube Focus: 検索結果ページを処理中...');
                if (settings.hideShortsInSearch) {
                    console.log('YouTube Focus: 検索結果ページのショート動画を非表示にします');
                    hideSearchResultsShorts();
                } else {
                    console.log('YouTube Focus: 検索結果ページのショート動画設定がオフのため、処理をスキップします');
                }
            } else if (path.includes('/shorts/')) {
                // ショート動画ページ
                console.log('YouTube Focus: ショート動画ページを処理中...');
                if (settings.hideShorts) {
                    console.log('YouTube Focus: ショート動画ページを非表示にします');
                    hideShortsPage();
                } else {
                    console.log('YouTube Focus: ショート動画ページ設定がオフのため、処理をスキップします');
                }
            }
        } catch (error) {
            console.warn('ページ処理中にエラーが発生しました:', error);
            // エラーが発生した場合はデフォルト設定で処理
            try {
                const path = window.location.pathname;
                console.log('YouTube Focus: フォールバック処理開始', { path });
                if (path === '/') {
                    console.log('YouTube Focus: フォールバック: ホームページの推奨動画設定がオフのため、処理をスキップします');
                } else if (path.includes('/results')) {
                    console.log('YouTube Focus: フォールバック: 検索結果ページのショート動画設定がオフのため、処理をスキップします');
                } else if (path.includes('/shorts/')) {
                    console.log('YouTube Focus: フォールバック: ショート動画ページ設定がオフのため、処理をスキップします');
                }
            } catch (fallbackError) {
                console.warn('フォールバック処理中にもエラーが発生しました:', fallbackError);
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

        try {
            // DOM準備完了を待つ
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    try {
                        setupEventListeners();
                        setupObserver();
                        processCurrentPage();
                        isInitialized = true;
                        console.log('YouTube Focus: 初期化完了');
                    } catch (error) {
                        console.warn('DOMContentLoaded後の初期化中にエラーが発生しました:', error);
                        // 基本的な機能は動作させる
                        setupEventListeners();
                        setupObserver();
                        isInitialized = true;
                    }
                });
            } else {
                setupEventListeners();
                setupObserver();
                processCurrentPage();
                isInitialized = true;
                console.log('YouTube Focus: 初期化完了');
            }
        } catch (error) {
            console.warn('初期化中にエラーが発生しました:', error);
            // エラーが発生しても基本的な機能は動作させる
            try {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        setupEventListeners();
                        setupObserver();
                        isInitialized = true;
                    });
                } else {
                    setupEventListeners();
                    setupObserver();
                    isInitialized = true;
                }
            } catch (innerError) {
                console.warn('フォールバック初期化中にもエラーが発生しました:', innerError);
                isInitialized = true;
            }
        }
    }

    // メッセージリスナー（ポップアップからの設定変更に対応）
    if (isChromeAPIAvailable()) {
        try {
            if (chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                    try {
                        if (request.action === 'updateSettings') {
                            console.log('YouTube Focus: 設定更新を受信', request.settings);
                            // 設定を更新してから処理を実行
                            if (request.settings) {
                                // 設定を即座に適用
                                processCurrentPageWithSettings(request.settings);
                            } else {
                                processCurrentPage();
                            }
                            sendResponse({ success: true });
                        }
                    } catch (error) {
                        console.warn('メッセージ処理中にエラーが発生しました:', error);
                        try {
                            sendResponse({ success: false, error: error.message });
                        } catch (sendError) {
                            console.warn('sendResponse中にエラーが発生しました:', sendError);
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('メッセージリスナーの設定中にエラーが発生しました:', error);
        }
    }

    // 指定された設定で現在のページを処理する関数
    function processCurrentPageWithSettings(settings) {
        const path = window.location.pathname;

        console.log('YouTube Focus: 指定された設定でページ処理開始', { path, settings });

        // 設定の状態に応じてCSSクラスを追加・削除
        if (settings.hideSuggestions || settings.hideShorts || settings.hideShortsInSearch) {
            document.body.classList.add('youtube-focus-enabled');
            document.body.classList.remove('youtube-focus-disabled');
        } else {
            document.body.classList.add('youtube-focus-disabled');
            document.body.classList.remove('youtube-focus-enabled');
        }

        if (path === '/') {
            // ホームページ
            if (settings.hideSuggestions) {
                console.log('YouTube Focus: ホームページの推奨動画を非表示にします');
                hideHomePageSuggestions();
            } else {
                console.log('YouTube Focus: ホームページの推奨動画設定がオフのため、処理をスキップします');
            }
        } else if (path.includes('/results')) {
            // 検索結果ページ
            if (settings.hideShortsInSearch) {
                console.log('YouTube Focus: 検索結果ページのショート動画を非表示にします');
                hideSearchResultsShorts();
            } else {
                console.log('YouTube Focus: 検索結果ページのショート動画設定がオフのため、処理をスキップします');
            }
        } else if (path.includes('/shorts/')) {
            // ショート動画ページ
            if (settings.hideShorts) {
                console.log('YouTube Focus: ショート動画ページを非表示にします');
                hideShortsPage();
            } else {
                console.log('YouTube Focus: ショート動画ページ設定がオフのため、処理をスキップします');
            }
        }
    }

    // 初期化開始
    initialize();
})();
