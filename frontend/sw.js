const CACHE_VERSION = 'lawlens-v4';
const STATIC_CACHE = 'lawlens-static-v4';
const RUNTIME_CACHE = 'lawlens-runtime-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(n => n !== STATIC_CACHE && n !== RUNTIME_CACHE)
          .map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.method !== 'GET') return;

  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ico)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && request.mode === 'navigate') {
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});
