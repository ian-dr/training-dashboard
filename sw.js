/* Service worker
 * - Precaches the app shell (all assets are local; no external CDN).
 * - Navigations: network-first so a new deploy is picked up immediately,
 *   with a cached fallback when offline.
 * - Static assets: stale-while-revalidate for fast loads that self-update.
 */
const CACHE = 'training-dashboard-v9';
const SHELL = [
  './',
  './index.html',
  './history.html',
  './strength-template.html',
  './weekly_training_program_template.html',
  './styles/main.css',
  './scripts/utils.js',
  './scripts/storage.js',
  './scripts/app.js',
  './vendor/html2canvas.min.js',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations: network-first, fall back to cache, then to the dashboard.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true })
          .then((cached) => cached || caches.match('./index.html'))),
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate.
  if (new URL(request.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
