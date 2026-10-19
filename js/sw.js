/* Service worker: funciona sin conexión.
   - Archivos propios: devuelve caché al instante y actualiza en segundo plano.
   - Leaflet y teselas del mapa: se guardan al verlas (caché primero).
   Al cambiar archivos del shell, subí el número de VERSION. */
const VERSION = 'nqn-v2';
const SHELL = ['./', 'index.html', 'admin.html', 'css/style.css', 'js/shared.js', 'js/app.js', 'js/admin.js', 'js/importar.js', 'js/config.js',
  'lugares.json', 'manifest.json', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const propio = new URL(req.url).origin === location.origin;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const red = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || red; // caché primero; la red actualiza en segundo plano
  }));
});
