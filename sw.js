/* Service Worker for Warframe Shopping List */
const VERSION = 'v1.0.5';
const STATIC_CACHE = `wf-static-${VERSION}`;
const RUNTIME_CACHE = `wf-runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/wf-list/',               // ensure navigation fallback can resolve shell
  '/wf-list/index.html',
  '/wf-list/css/style.css',
  '/wf-list/js/app.js',
  '/wf-list/favicon.svg',
  '/wf-list/offline.html',
  '/wf-list/icons/icon-192.png',
  '/wf-list/icons/icon-512.png',
  '/wf-list/icons/maskable-512.png',
  '/wf-list/icons/apple-touch-icon-180.png'
];

// Simple helper: identify GET API endpoints we want to cache SWR-style
function isApiGet(url) {
  try {
    const u = new URL(url);
    // Only cache our same-origin GET APIs
    if (u.origin !== self.location.origin) return false;
    if (!/\.php$/i.test(u.pathname)) return false;
    // whitelist read-only endpoints
    const readOnly = new Set([
      '/get-items.php',
      '/get-lists.php',
      '/get-list-items.php',
      '/get-orders-cache.php',
      '/get-orders.php'
    ]);
    return readOnly.has(u.pathname);
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch strategies:
// - Navigations: network-first, fallback to offline.html
// - Static assets (css/js/img/font): cache-first
// - Read-only API GETs: stale-while-revalidate in RUNTIME_CACHE
// - POST/other methods: pass-through
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GETs here
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // 1) Navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const fresh = await fetch(request);
          // Optionally, we could cache HTML shells here too
          return fresh;
        } catch (err) {
          // Offline fallback
          const cache = await caches.open(STATIC_CACHE);
          return (await cache.match('/offline.html')) ||
                 (await cache.match('/index.html')) ||
                 Response.error();
        }
      })()
    );
    return;
  }

  // 2) Static assets cache-first
  const staticDest = request.destination;
  const isStatic =
    staticDest === 'style' || staticDest === 'script' || staticDest === 'font' ||
    staticDest === 'image' || /\.(?:css|js|png|jpg|jpeg|svg|ico|webp|woff2?)$/i.test(url.pathname);

  if (isStatic && isSameOrigin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, fresh.clone()).catch(() => {});
        return fresh;
      })()
    );
    return;
  }

  // 3) API GETs: stale-while-revalidate
  if (isApiGet(request.url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then(resp => {
            // Only cache successful responses
            if (resp && resp.ok) {
              cache.put(request, resp.clone()).catch(() => {});
            }
            return resp;
          })
          .catch(() => null);

        // Return cached immediately if available; otherwise wait for network
        return cached || (await networkPromise) ||
          // If both fail, fall back to a minimal Response
          new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
      })()
    );
    return;
  }

  // 4) Default: just fetch
  // (You can add more routing here if needed)
});
