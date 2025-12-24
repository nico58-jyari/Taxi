// sw.js
const CACHE_NAME = 'taxi-nippo-pro-v8-5-0'; // ←更新するたびに数字を変える（超重要）
const CORE_ASSETS = [
  './',
  './index.html',
  './icon.png',
  './OGP.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  // すぐ有効化したい場合は、ユーザーが押した時だけにする（下のmessageで対応）
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

// 更新ボタン押下で待機中SWを即時有効化
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 基本：キャッシュ優先、なければネット
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // GET以外は触らない
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    const res = await fetch(req);
    // 同一オリジンだけキャッシュ（CDNはキャッシュしない方が事故りにくい）
    try {
      const url = new URL(req.url);
      if (url.origin === self.location.origin) {
        cache.put(req, res.clone());
      }
    } catch {}
    return res;
  })());
});
