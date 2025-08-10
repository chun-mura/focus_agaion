import { PopupManager } from './popup-manager';

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
  console.log('Focus Agaion: DOMContentLoadedイベントが発生しました');
  try {
    new PopupManager();
  } catch (error) {
    console.error('Focus Agaion: PopupManagerの初期化に失敗しました:', error);
    // エラーが発生した場合のフォールバック処理
    const currentPageElement = document.getElementById('currentPage');
    const extensionStatusElement = document.getElementById('extensionStatus');

    if (currentPageElement) {
      currentPageElement.textContent = '初期化エラー';
    }
    if (extensionStatusElement) {
      extensionStatusElement.textContent = 'エラー';
    }
  }
});
