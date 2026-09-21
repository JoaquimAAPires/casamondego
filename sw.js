// Service Worker - Casa Mondego PWA
const CACHE_NAME = 'casa-mondego-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css?family=Montserrat%3A400%2C700%7CCourgette&display=swap'
];

// Instalação - salva arquivos essenciais no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => console.warn('[SW] Falha no cache:', err))
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estratégia "Network First" (tenta internet, se falhar usa cache)
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET e de outros domínios
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona a resposta e salva no cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se não tem internet, busca no cache
        return caches.match(event.request).then((response) => {
          return response || caches.match('/index.html');
        });
      })
  );
});
