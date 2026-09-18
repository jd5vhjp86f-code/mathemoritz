import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.tsx';
import './ui/styles.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Das Wurzelelement #root fehlt in index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/*
 * Service Worker anmelden, damit die App ohne Netz läuft.
 *
 * Nur im fertigen Build: Während der Entwicklung würde ein Worker den
 * Neuladen-Kreislauf stören. Schlägt die Anmeldung fehl, ist das kein Grund
 * zur Aufregung - dann läuft die App eben nur online.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ohne Service Worker geht es auch.
    });
  });
}
