/* 製程流程建構器 — Service Worker(離線快取) */
const CACHE = 'twms-flow-v1';
const SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Google Fonts:首次連線後快取,之後可離線
  if (url.hostname.indexOf('fonts.googleapis.com') >= 0 || url.hostname.indexOf('fonts.gstatic.com') >= 0) {
    e.respondWith(caches.open(CACHE).then(c =>
      c.match(e.request).then(r => r || fetch(e.request).then(resp => { c.put(e.request, resp.clone()); return resp; }).catch(() => r))
    ));
    return;
  }
  // 同網域:cache-first,離線時導覽請求回退到 index.html
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return resp;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
