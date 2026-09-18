import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Erzeugt einen Service Worker, der den fertigen Build vorhält.
 *
 * Bewusst selbst gebaut statt per Plugin aus dem Netz: Es geht um eine
 * Handvoll Dateien, und der Dateiname mit Hash steht erst beim Bauen fest.
 * Die App muss auf dem Schulweg ohne Empfang laufen - mehr soll der Worker
 * nicht können.
 */
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'mathe-trainer-service-worker',
    apply: 'build',
    generateBundle(_optionen, bundle) {
      const dateien = Object.keys(bundle)
        .filter((name) => !name.endsWith('.map'))
        .map((name) => `/${name}`);
      // '/' und '/index.html' beide vorhalten: Beide Adressen führen zur App,
      // und ohne Netz muss jede von ihnen aus dem Vorrat bedient werden können.
      const vorrat = ['/', '/index.html', ...dateien];
      // Der Hash im Namen des JS-Bündels taugt als Version.
      const buendel = Object.keys(bundle).find((name) => name.endsWith('.js')) ?? '';
      const version = /-([A-Za-z0-9_-]+)\.js$/.exec(buendel)?.[1] ?? String(Date.now());

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Erzeugt beim Bauen. Nicht von Hand ändern.
const CACHE = 'mathe-trainer-${version}';
const VORRAT = ${JSON.stringify(vorrat)};

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches
      .open(CACHE)
      .then((speicher) => speicher.addAll(VORRAT))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;
  if (new URL(anfrage.url).origin !== self.location.origin) return;

  // Seitenaufrufe: erst das Netz, damit Neues ankommt; ohne Netz aus dem Vorrat.
  if (anfrage.mode === 'navigate') {
    ereignis.respondWith(
      fetch(anfrage).catch(() => caches.match('/index.html').then((treffer) => treffer ?? caches.match('/'))),
    );
    return;
  }

  // Dateien mit Hash im Namen ändern sich nie - die kommen aus dem Vorrat.
  ereignis.respondWith(
    caches.match(anfrage).then(
      (treffer) =>
        treffer ??
        fetch(anfrage).then((antwort) => {
          if (antwort.ok) {
            const kopie = antwort.clone();
            void caches.open(CACHE).then((speicher) => speicher.put(anfrage, kopie));
          }
          return antwort;
        }),
    ),
  );
});
`,
      });
    },
  };
}

// Deployment: GitHub Pages auf eigener Domain (mathemoritz.rosenbaum.hamburg) -> base '/'.
export default defineConfig({
  base: '/',
  plugins: [react(), serviceWorkerPlugin()],
  build: {
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
