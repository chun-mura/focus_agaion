import { Settings } from '../types';

// デフォルト設定
export const DEFAULT_SETTINGS: Settings = {
  hideSuggestions: false,
  hideShorts: false,
  hideShortsInSearch: false
};

// YouTube関連のセレクター
export const YOUTUBE_SELECTORS = {
  // ホームページ関連
  RICH_ITEM_RENDERER: 'ytd-rich-item-renderer',
  REEL_SHELF_RENDERER: 'ytd-reel-shelf-renderer',
  REEL_ITEM_RENDERER: 'ytd-reel-item-renderer',

  // ショート動画関連
  SHORTS_PLAYER: 'ytd-shorts-player',
  SHORTS_INNER_CONTAINER: '#shorts-inner-container',
  REEL_VIDEO_IN_SEQUENCE: '.reel-video-in-sequence-new',
  REEL_VIDEO_RENDERER: 'ytd-reel-video-renderer',
  EXPERIMENT_OVERLAY: '.experiment-overlay',
  ACTION_CONTAINER: '.action-container',
  METADATA_CONTAINER: '.metadata-container',

  // 検索結果関連
  SHORTS_LOCKUP: '.shortsLockupViewModelHost',
  VIDEO_RENDERER: 'ytd-video-renderer',
  SHELF_RENDERER: 'ytd-shelf-renderer',

  // その他
  THUMBNAIL_OVERLAY: 'ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]',
  TITLE_ELEMENT: '#title'
} as const;

// 非表示要素の理由
export const HIDE_REASONS = {
  HOME_PAGE_SUGGESTIONS: 'ホームページ推奨動画アイテム',
  HOME_PAGE_SHORTS_SECTION: 'ホームページショート動画セクション',
  HOME_PAGE_SHORTS_RENDERER: 'ホームページショート動画レンダラー',
  HOME_PAGE_SHORTS_ITEM: 'ホームページショート動画アイテム',
  SEARCH_RESULTS_SHORTS: '検索結果ショート動画',
  SEARCH_RESULTS_SHORTS_ALT: '検索結果ショート動画（代替検出）',
  SEARCH_RESULTS_SHORTS_REEL: '検索結果ショート動画（reel）',
  SEARCH_RESULTS_SHORTS_SECTION: '検索結果ショート動画セクション',
  SHORTS_ELEMENTS: 'ショート動画要素'
} as const;

// 更新間隔（ミリ秒）
export const UPDATE_INTERVAL = 5000;

// 処理遅延（ミリ秒）
export const PROCESS_DELAY = 100;
export const NAVIGATION_DELAY = 500;
