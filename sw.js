const CACHE_NAME = 'training-dashboard-v6';
const urlsToCache = [
  './',
  './index.html',
  './strength-template.html',
  './history.html',
  './weekly_training_program_template.html',
  './styles/main.css',
  './scripts/storage.js',
  './scripts/utils.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch(err => {
        console.log('Cache install error:', err);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - cache first for navigation, network first for other resources
self.addEventListener('fetch', event => {
  // For navigation requests (HTML pages), use cache-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('Serving from cache:', event.request.url);
            // Try to update cache in background
            fetch(event.request)
              .then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response);
                  });
                }
              })
              .catch(() => {}); // Ignore network errors for background update

            return cachedResponse;
          }

          // No cached version, try network
          console.log('No cache found, trying network:', event.request.url);
          return fetch(event.request).catch(err => {
            console.log('Navigation request failed and no cache available:', err);
            throw err;
          });
        })
    );
  } else {
    // For other requests, use network-first strategy
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Update cache with fresh content
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(err => {
          // Network failed, try cache
          console.log('Network failed, using cache:', err);
          return caches.match(event.request).then(response => {
            if (response) {
              return response;
            }
            throw err;
          });
        })
    );
  }
});
