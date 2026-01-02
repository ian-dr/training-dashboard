const CACHE_NAME = 'training-dashboard-v7';
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

// Fetch event - network first for HTML to get updates immediately
self.addEventListener('fetch', event => {
  // For navigation requests (HTML pages), use network-first strategy for faster updates
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            console.log('Serving from network and updating cache:', event.request.url);
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          }
          return response;
        })
        .catch(err => {
          // Network failed, try cache as fallback
          console.log('Network failed, trying cache:', err);
          return caches.match(event.request, { ignoreSearch: true })
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('Serving from cache (offline):', event.request.url);
                return cachedResponse;
              }
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
