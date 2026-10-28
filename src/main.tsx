import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker with immediate update check
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('EchoVault update available');
  },
  onOfflineReady() {
    console.info('EchoVault ready for offline operation');
  },
});

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
