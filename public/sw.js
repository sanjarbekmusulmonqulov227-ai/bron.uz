// bron.uz service worker: the app shell works offline; photos are cached as they are viewed.
const VERSION = "bron-v6";
const SHELL = ["./", "index.html", "styles.css", "app.js", "data.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.includes("/api/") || url.pathname.endsWith("/admin")) return; // always live

  // Own files: network first so updates arrive, cache as fallback offline.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("index.html"))));
    return;
  }

  // Photos and fonts: cache first.
  if (/wikimedia\.org|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION + "-media").then((c) => c.put(req, copy));
      return res;
    })));
  }
});
