// Bump VERSION on every deploy: it names the cache, so a new version is
// downloaded as a whole and old/new files are never mixed.
const VERSION = '4';
const CACHE_NAME = `rummikub-v${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/chart.js',
  './js/i18n.js',
  './js/state.js',
  './js/theme.js',
  './js/ui.js',
  './js/views/archive.js',
  './js/views/history.js',
  './js/views/navigation.js',
  './js/views/roundEntry.js',
  './js/views/scoreboard.js',
  './js/views/settings.js',
  './js/views/setup.js',
  './js/views/winner.js',
  './manifest.json',
  './favicon.ico',
  './favicon.svg',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  // No skipWaiting here: the page asks the user before activating an update
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Cache-first from the versioned cache; navigations fall back to the app shell
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') cache.put(request, response.clone());
        return response;
      } catch (e) {
        if (request.mode === 'navigate') {
          const shell = await cache.match('./index.html');
          if (shell) return shell;
        }
        throw e;
      }
    })
  );
});
