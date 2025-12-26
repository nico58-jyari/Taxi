// sw.js
const SW_VERSION = '9.4';
const CACHE_NAME = `taxi-pro-${SW_VERSION}`;

const CORE_ASSETS = [

  './',
  './index.html',
  './style.css?v=9.4',
  './icon01.png',
  './OGP.png',
  './app.js?v=9.4',

];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  // HTML
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return caches.match(req) || caches.match('./index.html');
      }
    })());
    return;
  }

  // JS / CSS
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return caches.match(req);
      }
    })());
    return;
  }

  // その他（画像など）
  event.respondWith(caches.match(req).then(res => res || fetch(req)));
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  // skipWaitingは「更新」ボタン押下で実行する設計のままでOK
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 基本：キャッシュ優先、なければネット
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    const res = await fetch(req);

    // 同一オリジンだけキャッシュ
    try {
      const url = new URL(req.url);
      if (url.origin === self.location.origin) {
        cache.put(req, res.clone());
      }
    } catch {}

    return res;
  })());
});
