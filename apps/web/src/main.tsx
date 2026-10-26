import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { OFFLINE_MODE } from './lib/offlineMode';
import './styles/app.css';
import './styles/gameHub.css';
import './styles/gameStatistics.css';
import './styles/gostopRoom.css';
import './styles/game.css';
import './styles/fiveGoCelebration.css';
import './styles/flowerTheme.css';
import './styles/familyMenuTheme.css';
import './styles/pastelUiTheme.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    void Promise.all([
      navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(
        registrations.map(registration => registration.unregister())
      )),
      'caches' in window
        ? caches.keys().then(keys => Promise.all(
          keys.filter(key => key.startsWith('nsj-hwatu-shell-')).map(key => caches.delete(key))
        ))
        : Promise.resolve([])
    ]).then(() => {
      if (wasControlled) window.location.reload();
    }).catch(() => undefined);
  });
} else if ('serviceWorker' in navigator && window.isSecureContext) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js?v=${OFFLINE_MODE ? 'offline1' : '9'}`, { updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(() => undefined);
  });
}

const Router = OFFLINE_MODE ? HashRouter : BrowserRouter;
createRoot(document.getElementById('root')!).render(
  <StrictMode><Router><App /></Router></StrictMode>
);
