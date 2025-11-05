const CACHE_NAME = 'poke-cache-v1';
const API_CACHE = 'poke-api-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// === INSTALACIÓN ===
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado y precachéando recursos base...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// === ACTIVACIÓN ===
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado, limpiando cachés viejas...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.url.includes('https://pokeapi.co/api/v2/pokemon')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch (error) {
          console.warn('Sin conexión, sirviendo Pokémon desde caché');
          const cachedResponse = await cache.match(request);
          return cachedResponse || new Response(JSON.stringify({ results: [] }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon } = event.data;
    self.registration.showNotification(title || "Pokédex actualizada", {
      body: body || "¡Atrápalos ya!",
      icon: icon || "/icons/pokeball.png",
      vibrate: [200, 100, 200],
      tag: "poke-notify",
    });
  }
});
