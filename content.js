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
            // chrome APIが利用可能かチェック
            if (!isChromeAPIAvailable()) {
                console.warn('chrome.storageが利用できません。デフォルト設定を使用します。');
                console.log('Focus Agaion: デフォルト設定を使用:', defaultSettings);
                resolve(defaultSettings);
                return;
            }

            // エラーハンドリング付きでストレージから取得
            const handleStorageResult = (result) => {
                try {
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
                        console.log('Focus Agaion: エラーのためデフォルト設定を使用:', defaultSettings);
                        resolve(defaultSettings);
                    } else {
                        // 結果が存在しない場合や、必要なプロパティが存在しない場合はデフォルト設定を使用
                        const settings = result || {};
                        const finalSettings = {
                            hideSuggestions: settings.hideSuggestions !== undefined ? settings.hideSuggestions : defaultSettings.hideSuggestions,
                            hideShorts: settings.hideShorts !== undefined ? settings.hideShorts : defaultSettings.hideShorts,
                            hideShortsInSearch: settings.hideShortsInSearch !== undefined ? settings.hideShortsInSearch : defaultSettings.hideShortsInSearch
                        };
                        resolve(finalSettings);
                    }
                } catch (error) {
                    console.warn('設定の取得中にエラーが発生しました:', error);
                    console.log('Focus Agaion: エラーのためデフォルト設定を使用:', defaultSettings);
                    resolve(defaultSettings);
                }
            };

            // ストレージから取得を試行（エラーハンドリング付き）
            try {
                // chrome.storage.sync.getの呼び出しを安全にラップ
                if (typeof chrome.storage.sync.get === 'function') {
                    chrome.storage.sync.get(defaultSettings, handleStorageResult);
                } else {
                    console.warn('chrome.storage.sync.getが利用できません。デフォルト設定を使用します。');
                    console.log('Focus Agaion: デフォルト設定を使用:', defaultSettings);
                    resolve(defaultSettings);
                }
            } catch (error) {
                console.warn('設定の取得中にエラーが発生しました:', error);
                console.log('Focus Agaion: エラーのためデフォルト設定を使用:', defaultSettings);
                resolve(defaultSettings);
            }
        });
    }

    // 要素を非表示にする関数
    function hideElement(element, reason = '') {
        if (element && !element.dataset.hiddenByExtension) {
            element.dataset.hiddenByExtension = reason;
            element.style.display = 'none';
            console.log(`Focus Agaion: 要素を非表示にしました - ${reason}`);
        }
    }

    // 要素を再表示する関数
    function showElement(element) {
        if (element && element.dataset.hiddenByExtension) {
            const reason = element.dataset.hiddenByExtension;
            console.log(`Focus Agaion: 要素を再表示中 - ${reason}`, element);
            delete element.dataset.hiddenByExtension;
            // 元の表示状態を復元（display: noneを削除）
            element.style.removeProperty('display');
            console.log(`Focus Agaion: 要素を再表示しました - ${reason}`, element);
        } else if (element && element.style.display === 'none') {
            console.log(`Focus Agaion: 要素がdisplay: noneで非表示になっているため再表示中...`, element);
            element.style.removeProperty('display');
            console.log(`Focus Agaion: 要素を再表示しました`, element);
        } else if (element) {
            console.log(`Focus Agaion: 要素は既に表示されています`, element);
        } else {
            console.log(`Focus Agaion: 要素が無効です`);
        }
    }

    // 特定の理由で非表示にされた要素を再表示する関数
    function showElementsByReason(reason) {
        const hiddenElements = document.querySelectorAll(`[data-hidden-by-extension="${reason}"]`);
        console.log(`Focus Agaion: ${reason} で非表示にされた要素を検索中...`, hiddenElements.length, '個見つかりました');
        hiddenElements.forEach(element => {
            showElement(element);
        });

        // 追加: display: noneが設定されている要素も検索して再表示
        const allElements = document.querySelectorAll('*');
        let displayNoneCount = 0;
        allElements.forEach(element => {
            if (element.style.display === 'none' && element.dataset.hiddenByExtension === reason) {
                console.log(`Focus Agaion: ${reason} でdisplay: noneが設定されている要素を発見:`, element);
                showElement(element);
                displayNoneCount++;
            }
        });
        if (displayNoneCount > 0) {
            console.log(`Focus Agaion: ${reason} でdisplay: noneが設定されていた要素を${displayNoneCount}個再表示しました`);
        }
    }

    // ホームページのサジェスト欄を非表示
    function hideHomePageSuggestions() {
        // 推奨動画アイテムのみを非表示にする（ショート動画は除外）
        // 推奨動画は通常の動画アイテムで、ショート動画ではないもの
        const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
        videoItems.forEach(item => {
            // ショート動画でない場合のみ非表示にする
            const isShorts = item.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') ||
                            item.querySelector('.ytd-reel-item-renderer') ||
                            item.closest('ytd-reel-shelf-renderer') ||
                            item.querySelector('[aria-label*="ショート"]') ||
                            item.querySelector('[aria-label*="Shorts"]');

            if (!isShorts) {
                hideElement(item, 'ホームページ推奨動画アイテム');
            }
        });
    }

    // ホームページのショート動画セクションを非表示
    function hideHomePageShorts() {
        // ショート動画セクション全体
        const shortsSection = document.querySelector('ytd-reel-shelf-renderer');
        if (shortsSection) {
            hideElement(shortsSection, 'ホームページショート動画セクション');
        }

        // ショート動画専用レンダラー
        const reelItems = document.querySelectorAll('ytd-reel-item-renderer');
        reelItems.forEach(item => {
            hideElement(item, 'ホームページショート動画レンダラー');
        });

        // ショート動画として識別される動画アイテムのみ
        const shortsItems = document.querySelectorAll('ytd-rich-item-renderer');
        shortsItems.forEach(item => {
            const isShorts = item.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') ||
                            item.querySelector('.ytd-reel-item-renderer') ||
                            item.closest('ytd-reel-shelf-renderer') ||
                            item.querySelector('[aria-label*="ショート"]') ||
                            item.querySelector('[aria-label*="Shorts"]');

            if (isShorts) {
                hideElement(item, 'ホームページショート動画アイテム');
            }
        });
    }

    // ホームページのショート動画セクションを再表示
    function showHomePageShorts() {
        console.log('Focus Agaion: ホームページのショート動画を再表示中...');

        showElementsByReason('ホームページショート動画セクション');
        showElementsByReason('ホームページショート動画アイテム');
        showElementsByReason('ホームページショート動画レンダラー');

        // ショート動画として識別される動画アイテムのみを再表示
        const shortsItems = document.querySelectorAll('ytd-rich-item-renderer');
        shortsItems.forEach((item, index) => {
            const isShorts = item.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') ||
                            item.querySelector('.ytd-reel-item-renderer') ||
                            item.closest('ytd-reel-shelf-renderer') ||
                            item.querySelector('[aria-label*="ショート"]') ||
                            item.querySelector('[aria-label*="Shorts"]');

            if (isShorts) {
                if (item.dataset.hiddenByExtension === 'ホームページショート動画アイテム') {
                    console.log(`Focus Agaion: ショート動画アイテム${index}を再表示中...`);
                    showElement(item);
                } else if (item.style.display === 'none' && item.dataset.hiddenByExtension === 'ホームページショート動画アイテム') {
                    console.log(`Focus Agaion: ショート動画アイテム${index}がdisplay: noneで非表示になっているため再表示中...`);
                    item.style.removeProperty('display');
                    console.log(`Focus Agaion: ショート動画アイテム${index}を再表示しました`);
                }
            }
        });

        console.log('Focus Agaion: ホームページのショート動画の再表示完了');
    }

    // ホームページのサジェスト欄を再表示
    function showHomePageSuggestions() {
        console.log('Focus Agaion: ホームページの推奨動画を再表示中...');

        // まず、data-hidden-by-extension属性を持つ要素を検索して再表示
        showElementsByReason('ホームページ推奨動画アイテム');

        // 個別の推奨動画アイテムを再表示
        const videoItems = document.querySelectorAll('ytd-rich-item-renderer');
        console.log('Focus Agaion: 動画アイテム要素を発見:', videoItems.length, '個');
        videoItems.forEach((item, index) => {
            // ショート動画でない場合のみ再表示する
            const isShorts = item.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') ||
                            item.querySelector('.ytd-reel-item-renderer') ||
                            item.closest('ytd-reel-shelf-renderer') ||
                            item.querySelector('[aria-label*="ショート"]') ||
                            item.querySelector('[aria-label*="Shorts"]');

            if (!isShorts) {
                if (item.dataset.hiddenByExtension === 'ホームページ推奨動画アイテム') {
                    console.log(`Focus Agaion: 推奨動画アイテム${index}を再表示中...`);
                    showElement(item);
                } else if (item.style.display === 'none' && item.dataset.hiddenByExtension === 'ホームページ推奨動画アイテム') {
                    console.log(`Focus Agaion: 推奨動画アイテム${index}がdisplay: noneで非表示になっているため再表示中...`);
                    item.style.removeProperty('display');
                    console.log(`Focus Agaion: 推奨動画アイテム${index}を再表示しました`);
                }
            }
        });

        console.log('Focus Agaion: ホームページの推奨動画の再表示完了');
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
        // まず動画の音声を停止してから非表示にする
        stopShortsAudio();

        // 動画要素を直接操作して音声を停止
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            // 動画を強制的に停止
            try {
                video.pause();
                video.muted = true;
                video.volume = 0;
                video.currentTime = 0;
                video.setAttribute('muted', 'true');
                video.setAttribute('volume', '0');
                console.log('Focus Agaion: 動画要素を強制的に停止しました');
            } catch (error) {
                console.log('Focus Agaion: 動画要素の停止中にエラーが発生しました:', error);
            }
        });

        // ショート動画ページ全体を非表示
        const shortsPlayer = document.querySelector('ytd-shorts-player');
        if (shortsPlayer) {
            hideElement(shortsPlayer, 'ショート動画ページ');
        }

        // ショート動画コンテナ全体を非表示
        const shortsContainer = document.querySelector('#shorts-inner-container');
        if (shortsContainer) {
            hideElement(shortsContainer, 'ショート動画コンテナ');
        }

        // 個別のショート動画要素を非表示
        const reelVideos = document.querySelectorAll('.reel-video-in-sequence-new');
        reelVideos.forEach(video => {
            hideElement(video, 'ショート動画アイテム');
        });

        // ytd-reel-video-renderer要素を非表示
        const reelVideoRenderers = document.querySelectorAll('ytd-reel-video-renderer');
        reelVideoRenderers.forEach(renderer => {
            hideElement(renderer, 'ショート動画レンダラー');
        });

        // ショート動画のオーバーレイ要素を非表示
        const overlayElements = document.querySelectorAll('.experiment-overlay');
        overlayElements.forEach(overlay => {
            hideElement(overlay, 'ショート動画オーバーレイ');
        });

        // アクションコンテナを非表示
        const actionContainers = document.querySelectorAll('.action-container');
        actionContainers.forEach(container => {
            hideElement(container, 'ショート動画アクション');
        });

        // メタデータコンテナを非表示
        const metadataContainers = document.querySelectorAll('.metadata-container');
        metadataContainers.forEach(container => {
            hideElement(container, 'ショート動画メタデータ');
        });

        // 定期的に音声をチェックして停止する（2秒ごと）
        const audioCheckInterval = setInterval(() => {
            if (!window.location.pathname.includes('/shorts/')) {
                // ショート動画ページでなくなったら停止
                clearInterval(audioCheckInterval);
                return;
            }
            stopShortsAudio();
        }, 2000);

        // ページを離れる際にインターバルをクリア
        window.addEventListener('beforeunload', () => {
            clearInterval(audioCheckInterval);
        });
    }

    // ショート動画の音声を停止する関数
    function stopShortsAudio() {
        // すべての動画要素の音声を停止
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (video) {
                // 動画を一時停止
                if (!video.paused) {
                    video.pause();
                    console.log('Focus Agaion: 動画を一時停止しました');
                }
                // 音声をミュート
                video.muted = true;
                video.volume = 0;
                // 音声を無効化
                video.setAttribute('muted', 'true');
                video.setAttribute('volume', '0');
                console.log('Focus Agaion: 動画の音声を停止しました');
            }
        });

        // プレーヤー要素の音声も停止
        const players = document.querySelectorAll('ytd-player');
        players.forEach(player => {
            const playerVideo = player.querySelector('video');
            if (playerVideo) {
                if (!playerVideo.paused) {
                    playerVideo.pause();
                    console.log('Focus Agaion: プレーヤーの動画を一時停止しました');
                }
                playerVideo.muted = true;
                playerVideo.volume = 0;
                playerVideo.setAttribute('muted', 'true');
                playerVideo.setAttribute('volume', '0');
                console.log('Focus Agaion: プレーヤーの音声を停止しました');
            }
        });

        // ショート動画専用プレーヤーの音声も停止
        const shortsPlayers = document.querySelectorAll('#shorts-player video');
        shortsPlayers.forEach(video => {
            if (video) {
                if (!video.paused) {
                    video.pause();
                    console.log('Focus Agaion: ショート動画専用プレーヤーの動画を一時停止しました');
                }
                video.muted = true;
                video.volume = 0;
                video.setAttribute('muted', 'true');
                video.setAttribute('volume', '0');
                console.log('Focus Agaion: ショート動画専用プレーヤーの音声を停止しました');
            }
        });

        // 音声が再生されている可能性がある要素をすべて停止
        const allVideoElements = document.querySelectorAll('video, audio');
        allVideoElements.forEach(media => {
            if (media) {
                if (!media.paused) {
                    media.pause();
                    console.log('Focus Agaion: メディア要素を一時停止しました');
                }
                media.muted = true;
                if (media.volume !== undefined) {
                    media.volume = 0;
                }
                media.setAttribute('muted', 'true');
                if (media.hasAttribute('volume')) {
                    media.setAttribute('volume', '0');
                }
                console.log('Focus Agaion: メディア要素の音声を停止しました');
            }
        });

        // YouTubeの内部プレーヤーAPIも停止
        if (window.YT && window.YT.Player) {
            const ytPlayers = document.querySelectorAll('.html5-video-player');
            ytPlayers.forEach(player => {
                const playerVideo = player.querySelector('video');
                if (playerVideo) {
                    if (!playerVideo.paused) {
                        playerVideo.pause();
                        console.log('Focus Agaion: YouTubeプレーヤーの動画を一時停止しました');
                    }
                    playerVideo.muted = true;
                    playerVideo.volume = 0;
                    playerVideo.setAttribute('muted', 'true');
                    playerVideo.setAttribute('volume', '0');
                    console.log('Focus Agaion: YouTubeプレーヤーの音声を停止しました');
                }
            });
        }

        // YouTubeの内部APIを使用して音声を停止
        try {
            // YouTubeの内部プレーヤーオブジェクトを取得
            const ytPlayerElements = document.querySelectorAll('ytd-player');
            ytPlayerElements.forEach(playerElement => {
                // プレーヤーの内部APIにアクセス
                if (playerElement && playerElement.getPlayer) {
                    const player = playerElement.getPlayer();
                    if (player && typeof player.pauseVideo === 'function') {
                        player.pauseVideo();
                        console.log('Focus Agaion: YouTube内部APIで動画を一時停止しました');
                    }
                    if (player && typeof player.mute === 'function') {
                        player.mute();
                        console.log('Focus Agaion: YouTube内部APIで音声をミュートしました');
                    }
                }
            });
        } catch (error) {
            console.log('Focus Agaion: YouTube内部APIの使用中にエラーが発生しました:', error);
        }
    }

    // ショート動画ページを再表示
    function showShortsPage() {
        showElementsByReason('ショート動画ページ');
        showElementsByReason('ショート動画コンテナ');
        showElementsByReason('ショート動画アイテム');
        showElementsByReason('ショート動画レンダラー');
        showElementsByReason('ショート動画オーバーレイ');
        showElementsByReason('ショート動画アクション');
        showElementsByReason('ショート動画メタデータ');

        // 音声を復活させる
        restoreShortsAudio();
    }

    // ショート動画の音声を復活させる関数
    function restoreShortsAudio() {
        // すべての動画要素の音声を復活
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (video) {
                // ミュートを解除
                video.muted = false;
                video.volume = 1;
                video.removeAttribute('muted');
                video.removeAttribute('volume');
                console.log('Focus Agaion: 動画の音声を復活しました');
            }
        });

        // プレーヤー要素の音声も復活
        const players = document.querySelectorAll('ytd-player');
        players.forEach(player => {
            const playerVideo = player.querySelector('video');
            if (playerVideo) {
                playerVideo.muted = false;
                playerVideo.volume = 1;
                playerVideo.removeAttribute('muted');
                playerVideo.removeAttribute('volume');
                console.log('Focus Agaion: プレーヤーの音声を復活しました');
            }
        });

        // ショート動画専用プレーヤーの音声も復活
        const shortsPlayers = document.querySelectorAll('#shorts-player video');
        shortsPlayers.forEach(video => {
            if (video) {
                video.muted = false;
                video.volume = 1;
                video.removeAttribute('muted');
                video.removeAttribute('volume');
                console.log('Focus Agaion: ショート動画専用プレーヤーの音声を復活しました');
            }
        });

        // 音声が再生されている可能性がある要素をすべて復活
        const allVideoElements = document.querySelectorAll('video, audio');
        allVideoElements.forEach(media => {
            if (media) {
                media.muted = false;
                if (media.volume !== undefined) {
                    media.volume = 1;
                }
                media.removeAttribute('muted');
                if (media.hasAttribute('volume')) {
                    media.removeAttribute('volume');
                }
                console.log('Focus Agaion: メディア要素の音声を復活しました');
            }
        });

        // YouTubeの内部APIを使用して音声を復活
        try {
            // YouTubeの内部プレーヤーオブジェクトを取得
            const ytPlayerElements = document.querySelectorAll('ytd-player');
            ytPlayerElements.forEach(playerElement => {
                // プレーヤーの内部APIにアクセス
                if (playerElement && playerElement.getPlayer) {
                    const player = playerElement.getPlayer();
                    if (player && typeof player.unMute === 'function') {
                        player.unMute();
                        console.log('Focus Agaion: YouTube内部APIで音声を復活しました');
                    }
                }
            });
        } catch (error) {
            console.log('Focus Agaion: YouTube内部APIの使用中にエラーが発生しました:', error);
        }
    }

    // 現在のページを処理
    async function processCurrentPage() {
        try {
            const settings = await getSettings();
            const path = window.location.pathname;

            // 設定の状態に応じてCSSクラスを追加・削除
            if (settings.hideSuggestions) {
                document.body.classList.add('hide-suggestions-enabled');
                document.body.classList.remove('hide-suggestions-disabled');
            } else {
                document.body.classList.add('hide-suggestions-disabled');
                document.body.classList.remove('hide-suggestions-enabled');
            }

            if (settings.hideShorts) {
                document.body.classList.add('hide-shorts-enabled');
                document.body.classList.remove('hide-shorts-disabled');
            } else {
                document.body.classList.add('hide-shorts-disabled');
                document.body.classList.remove('hide-shorts-enabled');
            }

            if (settings.hideShortsInSearch) {
                document.body.classList.add('hide-shorts-search-enabled');
                document.body.classList.remove('hide-shorts-search-disabled');
            } else {
                document.body.classList.add('hide-shorts-search-disabled');
                document.body.classList.remove('hide-shorts-search-enabled');
            }

            // ホームページの処理
            if (path === '/') {
                console.log('Focus Agaion: ホームページを処理中...');

                // 推奨動画/ショート動画の処理
                if (settings.hideSuggestions) {
                    console.log('Focus Agaion: ホームページの推奨動画を非表示にします');
                    hideHomePageSuggestions();
                    hideHomePageShorts();
                } else {
                    console.log('Focus Agaion: ホームページの推奨動画設定がオフのため、再表示します');
                    showHomePageSuggestions();
                    showHomePageShorts();
                }
            }

            // 検索結果ページの処理
            if (path.includes('/results')) {
                if (settings.hideShortsInSearch) {
                    console.log('Focus Agaion: 検索結果ページのショート動画を非表示にします');
                    hideSearchResultsShorts();
                } else {
                    console.log('Focus Agaion: 検索結果ページのショート動画設定がオフのため、再表示します');
                    showSearchResultsShorts();
                }
            }

            // ショート動画ページの処理
            if (path.includes('/shorts/')) {
                if (settings.hideShorts) {
                    console.log('Focus Agaion: ショート動画ページを非表示にします');
                    hideShortsPage();
                } else {
                    console.log('Focus Agaion: ショート動画ページ設定がオフのため、再表示します');
                    showShortsPage();
                }
            }
        } catch (error) {
            console.warn('ページ処理中にエラーが発生しました:', error);
            // エラーが発生した場合はデフォルト設定で処理
            try {
                const path = window.location.pathname;
                console.log('Focus Agaion: フォールバック処理開始', { path });
                if (path === '/') {
                    console.log('Focus Agaion: フォールバック: ホームページの推奨動画設定がオフのため、処理をスキップします');
                } else if (path.includes('/results')) {
                    console.log('Focus Agaion: フォールバック: 検索結果ページのショート動画設定がオフのため、処理をスキップします');
                } else if (path.includes('/shorts/')) {
                    console.log('Focus Agaion: フォールバック: ショート動画ページ設定がオフのため、処理をスキップします');
                }
            } catch (fallbackError) {
                console.warn('フォールバック処理中にもエラーが発生しました:', fallbackError);
            }
        }
    }

    // 指定された設定で現在のページを処理する関数
    function processCurrentPageWithSettings(settings) {
        const path = window.location.pathname;

        // 設定の状態に応じてCSSクラスを追加・削除
        if (settings.hideSuggestions) {
            document.body.classList.add('hide-suggestions-enabled');
            document.body.classList.remove('hide-suggestions-disabled');
        } else {
            document.body.classList.add('hide-suggestions-disabled');
            document.body.classList.remove('hide-suggestions-enabled');
        }

        if (settings.hideShorts) {
            document.body.classList.add('hide-shorts-enabled');
            document.body.classList.remove('hide-shorts-disabled');
        } else {
            document.body.classList.add('hide-shorts-disabled');
            document.body.classList.remove('hide-shorts-enabled');
        }

        if (settings.hideShortsInSearch) {
            document.body.classList.add('hide-shorts-search-enabled');
            document.body.classList.remove('hide-shorts-search-disabled');
        } else {
            document.body.classList.add('hide-shorts-search-disabled');
            document.body.classList.remove('hide-shorts-search-enabled');
        }

        // ホームページの処理
        if (path === '/') {
            // 推奨動画/ショート動画の処理
            if (settings.hideSuggestions) {
                console.log('Focus Agaion: ホームページの推奨動画を非表示にします');
                hideHomePageSuggestions();
                hideHomePageShorts();
            } else {
                console.log('Focus Agaion: ホームページの推奨動画設定がオフのため、再表示します');
                showHomePageSuggestions();
                showHomePageShorts();
            }
        }

        // 検索結果ページの処理
        if (path.includes('/results')) {
            if (settings.hideShortsInSearch) {
                console.log('Focus Agaion: 検索結果ページのショート動画を非表示にします');
                hideSearchResultsShorts();
            } else {
                console.log('Focus Agaion: 検索結果ページのショート動画設定がオフのため、再表示します');
                showSearchResultsShorts();
            }
        }

        // ショート動画ページの処理
        if (path.includes('/shorts/')) {
            if (settings.hideShorts) {
                console.log('Focus Agaion: ショート動画ページを非表示にします');
                hideShortsPage();
            } else {
                console.log('Focus Agaion: ショート動画ページ設定がオフのため、再表示します');
                showShortsPage();
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
                                node.matches('ytd-reel-item-renderer') ||
                                node.matches('ytd-shorts-player') ||
                                node.matches('#shorts-inner-container') ||
                                node.matches('.reel-video-in-sequence-new') ||
                                node.matches('ytd-reel-video-renderer')
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
            console.log('Focus Agaion: ページ遷移開始');
        });

        document.addEventListener('yt-navigate-finish', () => {
            setTimeout(processCurrentPage, 500);
        });

        // URL変更の監視
        let currentUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('Focus Agaion: URL変更検出');
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
            // DOM準備完了を待つ
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    try {
                        setupEventListeners();
                        setupObserver();
                        processCurrentPage();
                        isInitialized = true;
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
                            console.log('Focus Agaion: 設定更新を受信', request.settings);
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

    // 初期化開始
    initialize();
})();
