const CACHE_NAME = "app-v3";
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

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;

      if (e.request.mode === "navigate") {
        return caches.match("index.html");
      }

      return fetch(e.request);
    })
  );
});
