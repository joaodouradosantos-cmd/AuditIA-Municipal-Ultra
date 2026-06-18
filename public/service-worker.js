const CACHE = "auditia-ultra-online-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./legal-base.js",
  "./config.js",
  "./auth-ui.js",
  "./export-word.js",
  "./export-pdf.js",
  "./enhancements.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }
  if (["script", "style"].includes(request.destination)) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
