/*
 * Routt service worker — hand-rolled so it works in dev and prod without a
 * build-time plugin. Goal: the app shell + the arrival/trip screens survive
 * with ZERO network (traveler just landed, no working SIM).
 *
 * Strategy:
 *  - precache the critical route shells + icons on install
 *  - navigations: network-first, fall back to cached route, then to "/"
 *  - static assets (_next/static, fonts, icons): cache-first
 *  - everything else same-origin GET: stale-while-revalidate
 *
 * Saved-trip + hotel data live in localStorage (already offline-durable), so
 * the SW only needs to cache the code + shell to make those screens work.
 */
const CACHE = "routt-v4";
const PRECACHE = [
  "/",
  "/trip",
  "/arrival",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // allSettled: a single 404 shouldn't abort the whole install.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static") ||
  url.pathname.startsWith("/icons/") ||
  /\.(?:js|css|woff2?|png|svg|ico|json|webmanifest)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // API responses are LIVE data — never serve them stale from cache.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations → network-first, fall back to cached shell.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match(url.pathname)) ||
            (await cache.match("/")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Static assets → cache-first.
  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else → stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const fetching = fetch(request)
        .then((fresh) => {
          caches.open(CACHE).then((cache) => cache.put(request, fresh.clone()));
          return fresh;
        })
        .catch(() => cached || Response.error());
      return cached || fetching;
    })(),
  );
});
