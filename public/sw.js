// bron.uz service worker: the app shell works offline; photos are cached as they are viewed.
const VERSION = "bron-v23";
const SHELL = ["./", "index.html", "styles.css", "i18n.js", "picker.js", "app.js", "kunlik.js", "kunlik.html", "cityinfo.js", "turistlar.html", "shaharlar.html", "foydali.js", "reja.js", "reja.html", "data.js", "sights.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "fonts/golos-text-latin.woff2", "fonts/yeseva-one-latin.woff2"];

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
  // Only page loads fall back to the home page; a missing script or JSON file fails as a network error.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))));
    return;
  }

  // Photos: cache first.
  if (/wikimedia\.org/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION + "-media").then((c) => c.put(req, copy));
      return res;
    })));
  }
});
