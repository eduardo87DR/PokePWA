const STATIC_CACHE = 'poke-static-v2';
const DATA_CACHE = 'poke-data-v2';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// === INSTALAR Y GUARDAR ARCHIVOS BASE ===
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Archivos precacheados');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// === ACTIVAR Y LIMPIAR VIEJOS ===
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (name) => name !== STATIC_CACHE && name !== DATA_CACHE
          )
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// === INTERCEPTAR FETCH ===
self.addEventListener('fetch', (event) => {
  const { request } = event;

 // Si es la API de Pokémon
  if (request.url.includes('https://pokeapi.co/api/v2/pokemon')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          cache.put(request.url, res.clone());
          return res;
        } catch (err) {
          console.log('Offline: sirviendo datos cacheados');
          const cachedRes = await cache.match(request.url);
          if (cachedRes) return cachedRes;
          
          // ⚠️ Si no hay nada cacheado, devolver aviso explícito
          return new Response(
            JSON.stringify({ offlineError: true, results: [] }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      })
    );
    return;
  }

  // Para otros recursos estáticos
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request)
          .then((res) => {
            return caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request.url, res.clone());
              return res;
            });
          })
          .catch(() =>
            caches.match('/index.html') // fallback básico
          )
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon } = event.data;
    self.registration.showNotification(title || 'Pokédex', {
      body: body || '¡Atrápalos todos!',
      icon: icon || '/logo192.png',
      vibrate: [200, 100, 200],
      tag: 'poke-notify'
    });
  }
});
