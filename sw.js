const CACHE_NAME = "app-v1";
const FILES = [
  "index.html",
  "app.js",
  "style.css",
  "manifest.json",
  "sw.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;

      // se è una navigazione (pagina) usa index.html
      if (e.request.mode === "navigate") {
        return caches.match("index.html");
      }

      return fetch(e.request);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
