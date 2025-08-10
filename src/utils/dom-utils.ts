import { HideReason } from '../types';

// 要素を非表示にする関数
export function hideElement(element: Element, reason: HideReason): void {
  if (element && !(element as HTMLElement).dataset.hiddenByExtension) {
    (element as HTMLElement).dataset.hiddenByExtension = reason;
    (element as HTMLElement).style.display = 'none';
  }
}

// 要素を再表示する関数
export function showElement(element: Element): void {
  if (element && (element as HTMLElement).dataset.hiddenByExtension) {
    delete (element as HTMLElement).dataset.hiddenByExtension;
    (element as HTMLElement).style.removeProperty('display');
  }
}

// 特定の理由で非表示にされた要素を再表示する関数
export function showElementsByReason(reason: HideReason): void {
  const hiddenElements = document.querySelectorAll(`[data-hidden-by-extension="${reason}"]`);
  hiddenElements.forEach(element => {
    showElement(element);
  });
}

// ショート動画かどうかを判定する関数
export function isShortsVideo(element: Element): boolean {
  return !!(
    element.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]') ||
    element.querySelector('.ytd-reel-item-renderer') ||
    element.closest('ytd-reel-shelf-renderer') ||
    element.querySelector('[aria-label*="ショート"]') ||
    element.querySelector('[aria-label*="Shorts"]')
  );
}

// 要素が存在するかチェックする関数
export function elementExists(selector: string): boolean {
  return document.querySelector(selector) !== null;
}

// 要素を安全に取得する関数
export function safeQuerySelector(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
}

// 要素を安全に取得する関数（複数）
export function safeQuerySelectorAll(selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch (error) {
    console.warn(`Invalid selector: ${selector}`, error);
    return [];
  }
}
