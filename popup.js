// YouTube Focus Extension - Popup Script

class PopupManager {
    constructor() {
        this.settings = {
            hideSuggestions: false,
            hideShorts: false,
            hideShortsInSearch: false
        };

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.updateStatus();
    }

    // 設定を読み込み
    async loadSettings() {
        try {
            console.log('YouTube Focus: 設定読み込み開始');
            const result = await chrome.storage.sync.get(this.settings);
            console.log('YouTube Focus: ストレージから取得した設定:', result);
            this.settings = { ...this.settings, ...result };
            console.log('YouTube Focus: 最終設定:', this.settings);
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
        }
    }

    // 設定を保存
    async saveSettings() {
        try {
            console.log('YouTube Focus: 設定保存開始:', this.settings);
            await chrome.storage.sync.set(this.settings);
            console.log('YouTube Focus: 設定を保存しました:', this.settings);

            // 現在のYouTubeタブに設定変更を通知
            const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
            console.log('YouTube Focus: 通知対象タブ数:', tabs.length);
            for (const tab of tabs) {
                try {
                    console.log('YouTube Focus: タブに設定変更を通知中:', tab.id);
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'updateSettings',
                        settings: this.settings
                    });
                    console.log('YouTube Focus: タブへの通知完了:', tab.id);
                } catch (error) {
                    // タブが閉じられている場合などは無視
                    console.log('タブへのメッセージ送信に失敗:', error);
                }
            }

            this.showNotification('設定を保存しました');
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
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
            this.showNotification('設定をリセットしました');
        } catch (error) {
            console.error('設定のリセットに失敗しました:', error);
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
            // 現在のタブ情報を取得
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];

            if (currentTab && currentTab.url && currentTab.url.includes('youtube.com')) {
                const url = new URL(currentTab.url);
                const path = url.pathname;

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

                document.getElementById('currentPage').textContent = pageType;
                document.getElementById('extensionStatus').textContent = '有効';
            } else {
                document.getElementById('currentPage').textContent = 'YouTubeページではありません';
                document.getElementById('extensionStatus').textContent = '無効';
            }
        } catch (error) {
            console.error('状態の更新に失敗しました:', error);
            document.getElementById('currentPage').textContent = 'エラー';
            document.getElementById('extensionStatus').textContent = 'エラー';
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 設定チェックボックスの変更
        document.getElementById('hideSuggestions').addEventListener('change', (e) => {
            this.settings.hideSuggestions = e.target.checked;
        });

        document.getElementById('hideShorts').addEventListener('change', (e) => {
            this.settings.hideShorts = e.target.checked;
        });

        document.getElementById('hideShortsInSearch').addEventListener('change', (e) => {
            this.settings.hideShortsInSearch = e.target.checked;
        });

        // 保存ボタン
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // リセットボタン
        document.getElementById('resetSettings').addEventListener('click', () => {
            if (confirm('設定をリセットしますか？')) {
                this.resetSettings();
            }
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
        `;

        document.body.appendChild(notification);

        // 3秒後に自動削除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
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
    new PopupManager();
});
