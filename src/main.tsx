import './index.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';

// Purge any legacy service worker caches that may have cached stale HTML/CSS
if ('caches' in window) {
  caches
    .keys()
    .then((keys) => {
      keys.forEach((key) => {
        if (key !== 'echovault-v3') {
          caches.delete(key);
        }
      });
    })
    .catch(() => {});
}

window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  if (
    msg.includes('WebSocket closed without opened') ||
    msg.includes('failed to connect to websocket')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);

