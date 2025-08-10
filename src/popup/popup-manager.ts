import { Settings, YouTubePageType, NotificationType } from '../types';
import { DEFAULT_SETTINGS, UPDATE_INTERVAL } from '../constants';
import { getCurrentTab, findYouTubeTabs, sendMessageToTab } from '../utils/chrome-api';

export class PopupManager {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private updateInterval: number | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
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
      const currentPageElement = document.getElementById('currentPage');
      const extensionStatusElement = document.getElementById('extensionStatus');

      if (currentPageElement) {
        currentPageElement.textContent = '初期化エラー';
      }
      if (extensionStatusElement) {
        extensionStatusElement.textContent = 'エラー';
      }
    }
  }

  // 設定を読み込み
  async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(this.settings);
      this.settings = { ...this.settings, ...result };
      console.log('Focus Agaion: 設定を読み込みました', this.settings);
    } catch (error) {
      console.error('Focus Agaion: 設定の読み込みに失敗しました:', error);
      // エラーが発生した場合はデフォルト設定を使用
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  // 設定を保存
  async saveSettings(): Promise<void> {
    try {
      console.log('Focus Agaion: 設定を保存中...', this.settings);
      await chrome.storage.sync.set(this.settings);

      // 現在のYouTubeタブに設定変更を通知
      const tabs = await findYouTubeTabs();
      console.log('Focus Agaion: YouTubeタブを検索中...', tabs.length, '個のタブが見つかりました');

      for (const tab of tabs) {
        if (tab.id) {
          try {
            await sendMessageToTab(tab.id, {
              action: 'updateSettings',
              settings: this.settings
            });
            console.log('Focus Agaion: タブ', tab.id, 'に設定変更を通知しました');
          } catch (error) {
            console.warn('Focus Agaion: タブ', tab.id, 'への通知に失敗しました:', error);
          }
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
  async resetSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
      this.settings = { ...DEFAULT_SETTINGS };
      this.updateUI();

      // 現在のYouTubeタブに設定変更を通知
      const tabs = await findYouTubeTabs();
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await sendMessageToTab(tab.id, {
              action: 'updateSettings',
              settings: DEFAULT_SETTINGS
            });
          } catch (error) {
            // タブが閉じられている場合などは無視
          }
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
  updateUI(): void {
    const hideSuggestionsElement = document.getElementById('hideSuggestions') as HTMLInputElement;
    const hideShortsElement = document.getElementById('hideShorts') as HTMLInputElement;
    const hideShortsInSearchElement = document.getElementById('hideShortsInSearch') as HTMLInputElement;

    if (hideSuggestionsElement) {
      hideSuggestionsElement.checked = this.settings.hideSuggestions;
    }
    if (hideShortsElement) {
      hideShortsElement.checked = this.settings.hideShorts;
    }
    if (hideShortsInSearchElement) {
      hideShortsInSearchElement.checked = this.settings.hideShortsInSearch;
    }
  }

  // 現在の状態を更新
  async updateStatus(): Promise<void> {
    try {
      console.log('Focus Agaion: ページ状態を更新中...');

      const tabs = await getCurrentTab();
      console.log('Focus Agaion: アクティブタブを検索中...', tabs);

      const currentTab = tabs;
      console.log('Focus Agaion: 現在のタブ:', currentTab);

      if (currentTab && currentTab.url && currentTab.url.includes('youtube.com')) {
        const url = new URL(currentTab.url);
        const path = url.pathname;
        console.log('Focus Agaion: YouTubeページを検出:', path);

        const pageType = this.getPageType(path);
        console.log('Focus Agaion: ページタイプを設定:', pageType);

        const currentPageElement = document.getElementById('currentPage');
        const extensionStatusElement = document.getElementById('extensionStatus');

        if (currentPageElement) {
          currentPageElement.textContent = pageType;
        }
        if (extensionStatusElement) {
          extensionStatusElement.textContent = '有効';
        }

        console.log('Focus Agaion: ページ状態の更新が完了しました');
      } else {
        console.log('Focus Agaion: YouTubeページではありません:', currentTab?.url);

        const currentPageElement = document.getElementById('currentPage');
        const extensionStatusElement = document.getElementById('extensionStatus');

        if (currentPageElement) {
          currentPageElement.textContent = 'YouTubeページではありません';
        }
        if (extensionStatusElement) {
          extensionStatusElement.textContent = '無効';
        }
      }
    } catch (error) {
      console.error('Focus Agaion: 状態の更新に失敗しました:', error);

      const currentPageElement = document.getElementById('currentPage');
      const extensionStatusElement = document.getElementById('extensionStatus');

      if (currentPageElement) {
        currentPageElement.textContent = 'エラー';
      }
      if (extensionStatusElement) {
        extensionStatusElement.textContent = 'エラー';
      }
    }
  }

  // ページタイプを取得
  private getPageType(path: string): YouTubePageType {
    if (path === '/') {
      return 'ホームページ';
    } else if (path.includes('/watch')) {
      return '動画ページ';
    } else if (path.includes('/results')) {
      return '検索結果ページ';
    } else if (path.includes('/shorts/')) {
      return 'ショート動画ページ';
    }
    return 'その他';
  }

  // 定期的なページ状態更新を開始
  startPeriodicUpdate(): void {
    // 既存のインターバルをクリア
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
    }

    // 5秒ごとにページ状態を更新
    this.updateInterval = window.setInterval(async () => {
      try {
        await this.updateStatus();
      } catch (error) {
        console.warn('Focus Agaion: 定期更新中にエラーが発生しました:', error);
      }
    }, UPDATE_INTERVAL);
  }

  // 定期的なページ状態更新を停止
  stopPeriodicUpdate(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // イベントリスナーの設定
  setupEventListeners(): void {
    // 設定チェックボックスの変更
    const hideSuggestionsElement = document.getElementById('hideSuggestions');
    const hideShortsElement = document.getElementById('hideShorts');
    const hideShortsInSearchElement = document.getElementById('hideShortsInSearch');
    const resetSettingsElement = document.getElementById('resetSettings');

    if (hideSuggestionsElement) {
      hideSuggestionsElement.addEventListener('change', (e) => {
        this.settings.hideSuggestions = (e.target as HTMLInputElement).checked;
        this.saveSettings(); // 自動保存
      });
    }

    if (hideShortsElement) {
      hideShortsElement.addEventListener('change', (e) => {
        this.settings.hideShorts = (e.target as HTMLInputElement).checked;
        this.saveSettings(); // 自動保存
      });
    }

    if (hideShortsInSearchElement) {
      hideShortsInSearchElement.addEventListener('change', (e) => {
        this.settings.hideShortsInSearch = (e.target as HTMLInputElement).checked;
        this.saveSettings(); // 自動保存
      });
    }

    // リセットボタン
    if (resetSettingsElement) {
      resetSettingsElement.addEventListener('click', () => {
        if (confirm('設定をリセットしますか？')) {
          this.resetSettings();
        }
      });
    }

    // ポップアップが閉じられる時の処理
    window.addEventListener('beforeunload', () => {
      this.stopPeriodicUpdate();
    });
  }

  // 通知を表示
  showNotification(message: string, type: NotificationType = 'success'): void {
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
