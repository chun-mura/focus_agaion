// 設定オブジェクトの型定義
export interface Settings {
  hideSuggestions: boolean;
  hideShorts: boolean;
  hideShortsInSearch: boolean;
}

// メッセージ通信の型定義
export interface MessageRequest {
  action: 'getSettings' | 'updateSettings' | 'getCurrentTab';
  settings?: Settings;
}

export interface MessageResponse {
  settings?: Settings;
  success?: boolean;
  error?: string;
  tab?: chrome.tabs.Tab;
}

// YouTubeページタイプの型定義
export type YouTubePageType = 'ホームページ' | '動画ページ' | '検索結果ページ' | 'ショート動画ページ' | 'その他';

// 非表示要素の理由の型定義
export type HideReason =
  | 'ホームページ推奨動画アイテム'
  | 'ホームページショート動画セクション'
  | 'ホームページショート動画レンダラー'
  | 'ホームページショート動画アイテム'
  | '検索結果ショート動画'
  | '検索結果ショート動画（代替検出）'
  | '検索結果ショート動画（reel）'
  | '検索結果ショート動画セクション'
  | 'ショート動画要素';

// 通知タイプの型定義
export type NotificationType = 'success' | 'error';
