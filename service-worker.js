const CACHE_NAME = "cocktailapp-static-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./add.html",
  "./detail.html",
  "./about.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/app.js",
  "./js/storage.js",
  "./js/index.js",
  "./js/add.js",
  "./js/detail.js",
  "./js/about.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { redirect: "follow" }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req, { redirect: "follow" }).catch(() => cached);
    })
  );
});

