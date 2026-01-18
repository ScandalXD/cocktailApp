const STATIC_CACHE = "cocktailapp-static-v4";
const IMG_CACHE = "cocktailapp-img-v4";

const ASSETS = [
  "/",
  "/index.html",
  "/add.html",
  "/detail.html",
  "/edit.html",
  "/profile.html",
  "/login.html",
  "/register.html",
  "/manifest.webmanifest",
  "/css/styles.css",
  "/js/app.js",
  "/js/index.js",
  "/js/add.js",
  "/js/detail.js",
  "/js/edit.js",
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

      const imgCache = await caches.open(IMG_CACHE);
      await imgCache.addAll(CATALOG_IMAGES);

      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== STATIC_CACHE && k !== IMG_CACHE) return caches.delete(k);
          return null;
        }),
      );
      self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.mode === "navigate" && url.origin === location.origin) {
    event.respondWith(
      (async () => {
        const cachedShell = await caches.match(new Request(url.pathname));
        if (cachedShell) return cachedShell;

        const cached = await caches.match(req);
        if (cached) return cached;

        try {
          const fresh = await fetch(req);
          const cache = await caches.open(STATIC_CACHE);
          cache.put(new Request(url.pathname), fresh.clone());
          return fresh;
        } catch {
          return (
            (await caches.match("/index.html")) ||
            new Response("Offline", { status: 503 })
          );
        }
      })(),
    );
    return;
  }

  if (req.method !== "GET") return;

  if (req.destination === "image") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;

        try {
          const fresh = await fetch(req);
          const cache = await caches.open(IMG_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cached || new Response("", { status: 504 });
        }
      })(),
    );
    return;
  }
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        if (url.origin === location.origin) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        return cached || new Response("", { status: 504 });
      }
    })(),
  );
});
