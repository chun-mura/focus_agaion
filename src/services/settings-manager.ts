import { Settings, MessageRequest, MessageResponse } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { getSettings, saveSettings, findYouTubeTabs, sendMessageToTab } from '../utils/chrome-api';

export class SettingsManager {
  private settings: Settings = { ...DEFAULT_SETTINGS };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadSettings();
    } catch (error) {
      console.error('設定の初期化に失敗しました:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  // 設定を読み込み
  async loadSettings(): Promise<void> {
    try {
      this.settings = await getSettings();
      console.log('設定を読み込みました:', this.settings);
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  // 設定を保存
  async saveSettings(newSettings: Settings): Promise<void> {
    try {
      console.log('設定を保存中...', newSettings);
      await saveSettings(newSettings);
      this.settings = { ...newSettings };

      // 現在のYouTubeタブに設定変更を通知
      await this.notifyYouTubeTabs(newSettings);

      console.log('設定の保存が完了しました');
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      throw error;
    }
  }

  // 設定をリセット
  async resetSettings(): Promise<void> {
    try {
      await this.saveSettings(DEFAULT_SETTINGS);
      console.log('設定をリセットしました');
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error);
      throw error;
    }
  }

  // YouTubeタブに設定変更を通知
  private async notifyYouTubeTabs(settings: Settings): Promise<void> {
    try {
      const tabs = await findYouTubeTabs();
      console.log('YouTubeタブを検索中...', tabs.length, '個のタブが見つかりました');

      for (const tab of tabs) {
        if (tab.id) {
          try {
            await sendMessageToTab(tab.id, {
              action: 'updateSettings',
              settings: settings
            });
            console.log('タブ', tab.id, 'に設定変更を通知しました');
          } catch (error) {
            console.warn('タブ', tab.id, 'への通知に失敗しました:', error);
          }
        }
      }
    } catch (error) {
      console.error('YouTubeタブへの通知に失敗しました:', error);
    }
  }

  // 設定を取得
  getSettings(): Settings {
    return { ...this.settings };
  }

  // 設定を更新
  async updateSettings(partialSettings: Partial<Settings>): Promise<void> {
    const newSettings = { ...this.settings, ...partialSettings };
    await this.saveSettings(newSettings);
  }

  // メッセージハンドラー
  async handleMessage(request: MessageRequest): Promise<MessageResponse> {
    switch (request.action) {
      case 'getSettings':
        return { settings: this.getSettings() };

      case 'updateSettings':
        if (request.settings) {
          await this.saveSettings(request.settings);
          return { success: true };
        }
        return { error: '設定が指定されていません' };

      case 'getCurrentTab':
        // この実装はbackground scriptで行う
        return { error: 'このアクションはbackground scriptで処理されます' };

      default:
        return { error: 'Unknown action' };
    }
  }
}
