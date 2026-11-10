const CACHE_NAME = 'mykalender-shell-v1';
const BASE = self.registration.scope;
const APP_SHELL = [
  BASE,
  new URL('manifest.webmanifest', BASE).href,
  new URL('icons/icon.svg', BASE).href
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('mykalender-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Keine privaten Supabase-Daten oder API-Antworten im Cache speichern.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(BASE, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(BASE)) || Response.error())
    );
    return;
  }

  if (url.pathname.startsWith(new URL(BASE).pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
  }
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
