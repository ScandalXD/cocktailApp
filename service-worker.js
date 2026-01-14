const STATIC_CACHE = "cocktailapp-static-v2";
const CATALOG_CACHE = "cocktailapp-catalog-v2";

const ASSETS = [
  "/",
  "/index.html",
  "/add.html",
  "/detail.html",
  "/profile.html",
  "/login.html",
  "/register.html",
  "/manifest.webmanifest",
  "/css/styles.css",
  "/js/app.js",
  "/js/index.js",
  "/js/add.js",
  "/js/detail.js",
  "/js/profile.js",
  "/js/login.js",
  "/js/register.js",
  "/js/auth.js",
  "/js/db.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const CATALOG_IMAGES = [
  "/icons/alcoholic/mojito.jpg",
  "/icons/alcoholic/margarita.jpg",
  "/icons/alcoholic/martini.jpg",
  "/icons/alcoholic/bloody-mary.jpg",
  "/icons/alcoholic/jagerbomb.jpg",
  "/icons/non-alcoholic/cranberry-spritzer.jpg",
  "/icons/non-alcoholic/ginger-ale.jpg",
  "/icons/non-alcoholic/hot-chocolate.jpg",
  "/icons/non-alcoholic/lynchburg-lemonade.jpg",
  "/icons/non-alcoholic/milkshake.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(ASSETS);

      const imgCache = await caches.open(CATALOG_CACHE);
      await imgCache.addAll(CATALOG_IMAGES);

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== STATIC_CACHE && k !== CATALOG_CACHE)
            return caches.delete(k);
          return Promise.resolve();
        })
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cached = await caches.match("/index.html");
          return (
            cached ||
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
      })()
    );
    return;
  }

  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        const url = new URL(req.url);
        if (url.origin === location.origin) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        return (
          cached ||
          new Response("", { status: 504, statusText: "Network error" })
        );
      }
    })()
  );
});
