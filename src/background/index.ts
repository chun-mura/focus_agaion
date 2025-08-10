import { SettingsManager } from '../services/settings-manager';
import { DEFAULT_SETTINGS } from '../constants';
import { getCurrentTab, findYouTubeTabs, sendMessageToTab } from '../utils/chrome-api';
import { MessageRequest, MessageResponse } from '../types';

class BackgroundService {
  private settingsManager: SettingsManager;

  constructor() {
    this.settingsManager = new SettingsManager();
    this.initialize();
  }

  private initialize(): void {
    this.setupInstallListener();
    this.setupActionListener();
    this.setupMessageListener();
    this.setupSuspendListener();
  }

  // 拡張機能のインストール時の処理
  private setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('Focus Agaion: 拡張機能がインストールされました', details.reason);

      // デフォルト設定を初期化
      chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
        // 設定が存在しない場合のみ初期化
        if (!result.hasOwnProperty('hideSuggestions')) {
          chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
            console.log('Focus Agaion: デフォルト設定を初期化しました');
          });
        }
      });
    });
  }

  // 拡張機能アイコンのクリック時の処理
  private setupActionListener(): void {
    chrome.action.onClicked.addListener((tab) => {
      // YouTubeページでのみポップアップを表示
      if (tab.url && tab.url.includes('youtube.com')) {
        chrome.action.setPopup({ popup: 'popup.html' });
      }
    });
  }

  // メッセージリスナー
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request: MessageRequest, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 非同期レスポンスのため
    });
  }

  // メッセージハンドラー
  private async handleMessage(request: MessageRequest, sender: any, sendResponse: (response: MessageResponse) => void): Promise<void> {
    try {
      switch (request.action) {
        case 'getSettings':
          const settings = this.settingsManager.getSettings();
          sendResponse({ settings });
          break;

        case 'updateSettings':
          if (request.settings) {
            await this.settingsManager.saveSettings(request.settings);

            // すべてのYouTubeタブに設定変更を通知
            const tabs = await findYouTubeTabs();
            for (const tab of tabs) {
              if (tab.id) {
                try {
                  await sendMessageToTab(tab.id, {
                    action: 'updateSettings',
                    settings: request.settings
                  });
                } catch (error) {
                  // エラーは無視（タブが閉じられている場合など）
                  console.warn('タブ', tab.id, 'への通知に失敗しました:', error);
                }
              }
            }
            sendResponse({ success: true });
          } else {
            sendResponse({ error: '設定が指定されていません' });
          }
          break;

        case 'getCurrentTab':
          const currentTab = await getCurrentTab();
          sendResponse({ tab: currentTab || undefined });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('メッセージ処理中にエラーが発生しました:', error);
      sendResponse({ error: 'Internal error' });
    }
  }

  // エラーハンドリング
  private setupSuspendListener(): void {
    chrome.runtime.onSuspend.addListener(() => {
      console.log('Focus Agaion: Service Workerが停止します');
    });
  }
}

// 初期化
new BackgroundService();
