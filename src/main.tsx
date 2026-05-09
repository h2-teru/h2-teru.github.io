import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 過去に登録されているかもしれない Service Worker を解除 (キャッシュ問題対策)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
