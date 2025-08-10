// Focus Agaion Extension - Popup Script

class PopupManager {
    constructor() {
        this.settings = {
            hideSuggestions: false,
            hideShorts: false,
            hideShortsInSearch: false
        };

        this.updateInterval = null;
        this.init();
    }

    async init() {
        try {
            console.log('Focus Agaion: ポップアップの初期化を開始...');
            await this.loadSettings();
            this.setupEventListeners();
            this.updateUI();
            await this.updateStatus();

            // 定期的なページ状態更新を開始
            this.startPeriodicUpdate();

            console.log('Focus Agaion: ポップアップの初期化が完了しました');
        } catch (error) {
            console.error('Focus Agaion: ポップアップの初期化に失敗しました:', error);
            // エラーが発生した場合でも基本的なUIは表示
            this.setupEventListeners();
            this.updateUI();
            // エラーメッセージを表示
            document.getElementById('currentPage').textContent = '初期化エラー';
            document.getElementById('extensionStatus').textContent = 'エラー';
        }
    }

    // 設定を読み込み
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(this.settings);
            this.settings = { ...this.settings, ...result };
            console.log('Focus Agaion: 設定を読み込みました', this.settings);
        } catch (error) {
            console.error('Focus Agaion: 設定の読み込みに失敗しました:', error);
            // エラーが発生した場合はデフォルト設定を使用
            this.settings = {
                hideSuggestions: false,
                hideShorts: false,
                hideShortsInSearch: false
            };
        }
    }

    // 設定を保存
    async saveSettings() {
        try {
            console.log('Focus Agaion: 設定を保存中...', this.settings);
            await chrome.storage.sync.set(this.settings);

            // 現在のYouTubeタブに設定変更を通知
            const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
            console.log('Focus Agaion: YouTubeタブを検索中...', tabs.length, '個のタブが見つかりました');

            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        settings: this.settings
                    });
                    console.log('Focus Agaion: タブ', tab.id, 'に設定変更を通知しました');
                } catch (error) {
                    console.warn('Focus Agaion: タブ', tab.id, 'への通知に失敗しました:', error);
                }
            }

            // 設定変更後にページ状態も更新
            await this.updateStatus();

            this.showNotification('設定を保存し、YouTubeページに即座に反映しました');
            console.log('Focus Agaion: 設定の保存が完了しました');
        } catch (error) {
            console.error('Focus Agaion: 設定の保存に失敗しました:', error);
            this.showNotification('設定の保存に失敗しました', 'error');
        }
    }

    // 設定をリセット
    async resetSettings() {
        try {
            const defaultSettings = {
                hideSuggestions: false,
                hideShorts: false,
                hideShortsInSearch: false
            };

            await chrome.storage.sync.set(defaultSettings);
            this.settings = defaultSettings;
            this.updateUI();

            // 現在のYouTubeタブに設定変更を通知
            const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
            for (const tab of tabs) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        settings: defaultSettings
                    });
                } catch (error) {
                    // タブが閉じられている場合などは無視
                }
            }

            this.showNotification('設定をリセットし、YouTubeページに即座に反映しました');

            // リセット後にもページ状態を更新
            await this.updateStatus();
        } catch (error) {
            console.error('Focus Agaion: 設定のリセットに失敗しました:', error);
            this.showNotification('設定のリセットに失敗しました', 'error');
        }
    }

    // UIの更新
    updateUI() {
        document.getElementById('hideSuggestions').checked = this.settings.hideSuggestions;
        document.getElementById('hideShorts').checked = this.settings.hideShorts;
        document.getElementById('hideShortsInSearch').checked = this.settings.hideShortsInSearch;
    }

    // 現在の状態を更新
    async updateStatus() {
        try {
            console.log('Focus Agaion: ページ状態を更新中...');

            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Focus Agaion: アクティブタブを検索中...', tabs);

            const currentTab = tabs[0];
            console.log('Focus Agaion: 現在のタブ:', currentTab);

            if (currentTab && currentTab.url && currentTab.url.includes('youtube.com')) {
                const url = new URL(currentTab.url);
                const path = url.pathname;
                console.log('Focus Agaion: YouTubeページを検出:', path);

                let pageType = 'その他';
                if (path === '/') {
                    pageType = 'ホームページ';
                } else if (path.includes('/watch')) {
                    pageType = '動画ページ';
                } else if (path.includes('/results')) {
                    pageType = '検索結果ページ';
                } else if (path.includes('/shorts/')) {
                    pageType = 'ショート動画ページ';
                }

                console.log('Focus Agaion: ページタイプを設定:', pageType);
                document.getElementById('currentPage').textContent = pageType;
                document.getElementById('extensionStatus').textContent = '有効';
                console.log('Focus Agaion: ページ状態の更新が完了しました');
            } else {
                console.log('Focus Agaion: YouTubeページではありません:', currentTab?.url);
                document.getElementById('currentPage').textContent = 'YouTubeページではありません';
                document.getElementById('extensionStatus').textContent = '無効';
            }
        } catch (error) {
            console.error('Focus Agaion: 状態の更新に失敗しました:', error);
            document.getElementById('currentPage').textContent = 'エラー';
            document.getElementById('extensionStatus').textContent = 'エラー';
        }
    }

    // 定期的なページ状態更新を開始
    startPeriodicUpdate() {
        // 既存のインターバルをクリア
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // 5秒ごとにページ状態を更新
        this.updateInterval = setInterval(async () => {
            try {
                await this.updateStatus();
            } catch (error) {
                console.warn('Focus Agaion: 定期更新中にエラーが発生しました:', error);
            }
        }, 5000);
    }

    // 定期的なページ状態更新を停止
    stopPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 設定チェックボックスの変更
        document.getElementById('hideSuggestions').addEventListener('change', (e) => {
            this.settings.hideSuggestions = e.target.checked;
            this.saveSettings(); // 自動保存
        });

        document.getElementById('hideShorts').addEventListener('change', (e) => {
            this.settings.hideShorts = e.target.checked;
            this.saveSettings(); // 自動保存
        });

        document.getElementById('hideShortsInSearch').addEventListener('change', (e) => {
            this.settings.hideShortsInSearch = e.target.checked;
            this.saveSettings(); // 自動保存
        });

        // リセットボタン
        document.getElementById('resetSettings').addEventListener('click', () => {
            if (confirm('設定をリセットしますか？')) {
                this.resetSettings();
            }
        });

        // ポップアップが閉じられる時の処理
        window.addEventListener('beforeunload', () => {
            this.stopPeriodicUpdate();
        });
    }

    // 通知を表示
    showNotification(message, type = 'success') {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // スタイルを適用
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notification);

        // 4秒後に自動削除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }
}

// アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Focus Agaion: DOMContentLoadedイベントが発生しました');
    try {
        new PopupManager();
    } catch (error) {
        console.error('Focus Agaion: PopupManagerの初期化に失敗しました:', error);
        // エラーが発生した場合のフォールバック処理
        document.getElementById('currentPage').textContent = '初期化エラー';
        document.getElementById('extensionStatus').textContent = 'エラー';
    }
});
