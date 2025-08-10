import { YouTubeProcessor } from '../services/youtube-processor';
import { getSettings } from '../utils/chrome-api';
import { DEFAULT_SETTINGS } from '../constants';

class ContentScript {
  private processor: YouTubeProcessor | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 設定を取得
      const settings = await getSettings();

      // YouTube Processorを初期化
      this.processor = new YouTubeProcessor(settings);
      this.processor.initialize();

      // メッセージリスナーを設定
      this.setupMessageListener();

      this.isInitialized = true;
      console.log('Content Script: 初期化が完了しました');
    } catch (error) {
      console.error('Content Script: 初期化に失敗しました:', error);
      // エラーが発生した場合でも基本的な処理は継続
      this.processor = new YouTubeProcessor(DEFAULT_SETTINGS);
      this.processor.initialize();
      this.isInitialized = true;
    }
  }

  // メッセージリスナー
  private setupMessageListener(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSettings' && this.processor) {
          // 設定変更を即座に反映
          this.processor.updateSettings(request.settings);
          sendResponse({ success: true });
        }
      });
    }
  }

  // 破棄
  destroy(): void {
    if (this.processor) {
      this.processor.destroy();
      this.processor = null;
    }
    this.isInitialized = false;
  }
}

// 初期化
let contentScript: ContentScript | null = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentScript = new ContentScript();
  });
} else {
  contentScript = new ContentScript();
}

// ページがアンロードされる際の処理
window.addEventListener('beforeunload', () => {
  if (contentScript) {
    contentScript.destroy();
  }
});
