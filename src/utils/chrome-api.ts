import { Settings } from '../types';

// Chrome APIが利用可能かチェックする関数
export function isChromeAPIAvailable(): boolean {
  return typeof chrome !== 'undefined' &&
        !!chrome.runtime &&
        !!chrome.storage &&
        !!chrome.storage.sync;
}

// 設定を取得する関数
export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    if (!isChromeAPIAvailable()) {
      resolve({
        hideSuggestions: false,
        hideShorts: false,
        hideShortsInSearch: false
      });
      return;
    }

    try {
      chrome.storage.sync.get({
        hideSuggestions: false,
        hideShorts: false,
        hideShortsInSearch: false
      }, (result) => {
        if (chrome.runtime.lastError) {
          resolve({
            hideSuggestions: false,
            hideShorts: false,
            hideShortsInSearch: false
          });
          return;
        }
        resolve(result as Settings);
      });
    } catch (error) {
      resolve({
        hideSuggestions: false,
        hideShorts: false,
        hideShortsInSearch: false
      });
    }
  });
}

// 設定を保存する関数
export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isChromeAPIAvailable()) {
      reject(new Error('Chrome API is not available'));
      return;
    }

    try {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 現在のタブを取得する関数
export async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise((resolve) => {
    if (!isChromeAPIAvailable()) {
      resolve(null);
      return;
    }

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

// YouTubeタブを検索する関数
export async function findYouTubeTabs(): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    if (!isChromeAPIAvailable()) {
      resolve([]);
      return;
    }

    try {
      chrome.tabs.query({ url: 'https://www.youtube.com/*' }, (tabs) => {
        resolve(tabs);
      });
    } catch (error) {
      resolve([]);
    }
  });
}

// タブにメッセージを送信する関数
export async function sendMessageToTab(tabId: number, message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isChromeAPIAvailable()) {
      reject(new Error('Chrome API is not available'));
      return;
    }

    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}
