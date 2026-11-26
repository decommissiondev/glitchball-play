// GLITCHBALL offline support. After the first visit the whole game is cached, so the
// Home Screen app keeps working with no connection. Pages are fetched network-first
// (so updates arrive when online); hashed build assets are cache-first.
// BUILD_ASSETS and BUILD_ID are filled in by the build (vite.config.ts) so the
// install step precaches every file the game needs, including hashed bundles.
const BUILD_ASSETS = ["./assets/index-CNlTAZJp.css","./assets/index-wP5c8cEo.js"];
const BUILD_ID = '1e4ac26823';
const CACHE = 'glitchball-' + BUILD_ID;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png', ...BUILD_ASSETS];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
