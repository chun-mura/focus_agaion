// Focus Agaion Extension - Background Script (Service Worker)

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Focus Agaion: 拡張機能がインストールされました', details.reason);

    // デフォルト設定を初期化
    const defaultSettings = {
        hideSuggestions: false,
        hideShorts: false,
        hideShortsInSearch: false
    };

    chrome.storage.sync.get(defaultSettings, (result) => {
        // 設定が存在しない場合のみ初期化
        if (!result.hasOwnProperty('hideSuggestions')) {
            chrome.storage.sync.set(defaultSettings, () => {
                console.log('Focus Agaion: デフォルト設定を初期化しました');
            });
        }
    });
});

// 拡張機能アイコンのクリック時の処理
chrome.action.onClicked.addListener((tab) => {
    // YouTubeページでのみポップアップを表示
    if (tab.url && tab.url.includes('youtube.com')) {
        chrome.action.setPopup({ popup: 'popup.html' });
    }
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getSettings':
            chrome.storage.sync.get(null, (settings) => {
                sendResponse({ settings });
            });
            return true;

        case 'updateSettings':
            chrome.storage.sync.set(request.settings, () => {
                // すべてのYouTubeタブに設定変更を通知
                chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updateSettings',
                            settings: request.settings
                        }).catch(() => {
                            // エラーは無視（タブが閉じられている場合など）
                        });
                    });
                });
                sendResponse({ success: true });
            });
            return true;

        case 'getCurrentTab':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                sendResponse({ tab: tabs[0] });
            });
            return true;

        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// エラーハンドリング
chrome.runtime.onSuspend.addListener(() => {
    console.log('Focus Agaion: Service Workerが停止します');
});
