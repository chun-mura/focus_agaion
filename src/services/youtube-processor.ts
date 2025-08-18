import { Settings, YouTubePageType, HideReason } from '../types';
import { YOUTUBE_SELECTORS, HIDE_REASONS } from '../constants';
import { hideElement, showElement, showElementsByReason, isShortsVideo } from '../utils/dom-utils';

export class YouTubeProcessor {
  private settings: Settings;
  private observer: MutationObserver | null = null;
  private isInitialized = false;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  // 設定を更新
  updateSettings(newSettings: Settings): void {
    this.settings = { ...newSettings };
    this.processCurrentPage();
  }

  // ホームページかどうかを判定（厳密にホームページのみ）
  private isHomePage(): boolean {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // パスが '/' で、クエリパラメータやハッシュがない場合のみホームページ
    return path === '/' && search === '' && hash === '';
  }

  // 初期化
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.setupObserver();
      this.setupEventListeners();
      this.processCurrentPage();
      this.isInitialized = true;
      console.log('YouTube Processor: 初期化が完了しました');
    } catch (error) {
      console.error('YouTube Processor: 初期化に失敗しました:', error);
      this.isInitialized = true;
    }
  }

  // 現在のページを処理
  processCurrentPage(): void {
    try {
      const path = window.location.pathname;
      const isHomePage = this.isHomePage();

      // 設定の状態に応じてCSSクラスを追加・削除
      document.body.classList.toggle('hide-suggestions-enabled', this.settings.hideSuggestions && isHomePage);
      document.body.classList.toggle('hide-shorts-enabled', this.settings.hideShorts);
      document.body.classList.toggle('hide-shorts-search-enabled', this.settings.hideShortsInSearch);

      // ホームページの処理（厳密にホームページのみ）
      if (isHomePage) {
        this.processHomePage();
      }

      // 検索結果ページの処理
      if (path.includes('/results')) {
        this.processSearchResultsPage();
      }

      // ショート動画ページの処理
      if (path.includes('/shorts/')) {
        this.processShortsPage();
      }

      console.log('ページ処理が完了しました', { path, isHomePage, settings: this.settings });
    } catch (error) {
      console.warn('ページ処理中にエラーが発生しました:', error);
    }
  }

  // ホームページの処理
  private processHomePage(): void {
    // 再度ホームページかどうかを確認
    if (!this.isHomePage()) {
      return;
    }

    if (this.settings.hideSuggestions) {
      this.hideHomePageSuggestions();
      this.hideHomePageShorts();
    } else {
      this.showHomePageElements();
    }
  }

  // ホームページの推奨動画を非表示
  private hideHomePageSuggestions(): void {
    const videoItems = document.querySelectorAll(YOUTUBE_SELECTORS.RICH_ITEM_RENDERER);
    Array.from(videoItems).forEach(item => {
      if (!isShortsVideo(item)) {
        hideElement(item, HIDE_REASONS.HOME_PAGE_SUGGESTIONS);
      }
    });
  }

  // ホームページのショート動画セクションを非表示
  private hideHomePageShorts(): void {
    const shortsSection = document.querySelector(YOUTUBE_SELECTORS.REEL_SHELF_RENDERER);
    if (shortsSection) {
      hideElement(shortsSection, HIDE_REASONS.HOME_PAGE_SHORTS_SECTION);
    }

    const reelItems = document.querySelectorAll(YOUTUBE_SELECTORS.REEL_ITEM_RENDERER);
    Array.from(reelItems).forEach(item => {
      hideElement(item, HIDE_REASONS.HOME_PAGE_SHORTS_RENDERER);
    });

    const shortsItems = document.querySelectorAll(YOUTUBE_SELECTORS.RICH_ITEM_RENDERER);
    Array.from(shortsItems).forEach(item => {
      if (isShortsVideo(item)) {
        hideElement(item, HIDE_REASONS.HOME_PAGE_SHORTS_ITEM);
      }
    });
  }

  // ホームページ要素を再表示
  private showHomePageElements(): void {
    // ホームページかどうかを確認
    if (!this.isHomePage()) {
      return;
    }

    showElementsByReason(HIDE_REASONS.HOME_PAGE_SUGGESTIONS);
    showElementsByReason(HIDE_REASONS.HOME_PAGE_SHORTS_SECTION);
    showElementsByReason(HIDE_REASONS.HOME_PAGE_SHORTS_ITEM);
    showElementsByReason(HIDE_REASONS.HOME_PAGE_SHORTS_RENDERER);
  }

  // 検索結果ページの処理
  private processSearchResultsPage(): void {
    if (this.settings.hideShortsInSearch) {
      this.hideSearchResultsShorts();
    } else {
      this.showSearchResultsElements();
    }
  }

  // 検索結果ページのショート動画を非表示
  private hideSearchResultsShorts(): void {
    const shortsVideos = document.querySelectorAll(YOUTUBE_SELECTORS.SHORTS_LOCKUP);
    Array.from(shortsVideos).forEach(video => {
      hideElement(video, HIDE_REASONS.SEARCH_RESULTS_SHORTS);
    });

    const alternativeShorts = document.querySelectorAll(`${YOUTUBE_SELECTORS.VIDEO_RENDERER}:has(${YOUTUBE_SELECTORS.THUMBNAIL_OVERLAY})`);
    Array.from(alternativeShorts).forEach(video => {
      hideElement(video, HIDE_REASONS.SEARCH_RESULTS_SHORTS_ALT);
    });

    const reelItems = document.querySelectorAll(YOUTUBE_SELECTORS.REEL_ITEM_RENDERER);
    Array.from(reelItems).forEach(item => {
      hideElement(item, HIDE_REASONS.SEARCH_RESULTS_SHORTS_REEL);
    });

    const shortsSections = document.querySelectorAll(YOUTUBE_SELECTORS.SHELF_RENDERER);
    Array.from(shortsSections).forEach(section => {
              const titleElement = section.querySelector(YOUTUBE_SELECTORS.TITLE_ELEMENT);
        if (titleElement && titleElement.textContent && titleElement.textContent.includes('ショート')) {
        hideElement(section, HIDE_REASONS.SEARCH_RESULTS_SHORTS_SECTION);
      }
    });
  }

  // 検索結果要素を再表示
  private showSearchResultsElements(): void {
    showElementsByReason(HIDE_REASONS.SEARCH_RESULTS_SHORTS);
    showElementsByReason(HIDE_REASONS.SEARCH_RESULTS_SHORTS_ALT);
    showElementsByReason(HIDE_REASONS.SEARCH_RESULTS_SHORTS_REEL);
    showElementsByReason(HIDE_REASONS.SEARCH_RESULTS_SHORTS_SECTION);
  }

  // ショート動画ページの処理
  private processShortsPage(): void {
    if (this.settings.hideShorts) {
      this.hideShortsPage();
    } else {
      showElementsByReason(HIDE_REASONS.SHORTS_ELEMENTS);
    }
  }

  // ショート動画ページを非表示
  private hideShortsPage(): void {
    // 動画要素を停止
    const allVideos = document.querySelectorAll('video');
    Array.from(allVideos).forEach(video => {
      try {
        (video as HTMLVideoElement).pause();
        (video as HTMLVideoElement).muted = true;
        (video as HTMLVideoElement).volume = 0;
        (video as HTMLVideoElement).currentTime = 0;
      } catch (error) {
        // エラーは無視
      }
    });

    // ショート動画関連要素を非表示
    const shortsElements = [
      YOUTUBE_SELECTORS.SHORTS_PLAYER,
      YOUTUBE_SELECTORS.SHORTS_INNER_CONTAINER,
      YOUTUBE_SELECTORS.REEL_VIDEO_IN_SEQUENCE,
      YOUTUBE_SELECTORS.REEL_VIDEO_RENDERER,
      YOUTUBE_SELECTORS.EXPERIMENT_OVERLAY,
      YOUTUBE_SELECTORS.ACTION_CONTAINER,
      YOUTUBE_SELECTORS.METADATA_CONTAINER
    ];

    shortsElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      Array.from(elements).forEach(element => {
        hideElement(element, HIDE_REASONS.SHORTS_ELEMENTS);
      });
    });
  }

  // MutationObserverの設定
  private setupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE && (node as Element).matches) {
              const selectors = [
                YOUTUBE_SELECTORS.RICH_ITEM_RENDERER,
                YOUTUBE_SELECTORS.REEL_SHELF_RENDERER,
                YOUTUBE_SELECTORS.SHORTS_LOCKUP,
                YOUTUBE_SELECTORS.REEL_ITEM_RENDERER,
                YOUTUBE_SELECTORS.SHORTS_PLAYER,
                YOUTUBE_SELECTORS.SHORTS_INNER_CONTAINER,
                YOUTUBE_SELECTORS.REEL_VIDEO_IN_SEQUENCE,
                YOUTUBE_SELECTORS.REEL_VIDEO_RENDERER
              ];

              if (selectors.some(selector => (node as Element).matches(selector))) {
                shouldProcess = true;
                break;
              }
            }
          }
          if (shouldProcess) break;
        }
      }

      if (shouldProcess) {
        setTimeout(() => this.processCurrentPage(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // イベントリスナーの設定
  private setupEventListeners(): void {
    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(() => this.processCurrentPage(), 500);
    });

    // URL変更の監視
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(() => this.processCurrentPage(), 500);
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 破棄
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}
