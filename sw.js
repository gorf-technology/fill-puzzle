// index.html 의 CONFIG.VERSION 과 반드시 같은 버전으로 함께 업로드
const CACHE_NAME = 'fill-puzzle-v1.0.0';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('/index.html');

  if (isPage) {
    // network-first: 새 버전 즉시 반영, 오프라인이면 캐시
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // cache-first: 아이콘, manifest
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
