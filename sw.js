/* FIFO Roster service worker
   Network-first for the app itself so a new build shows up as soon as you're
   online, cache-first for icons, and a full offline fallback either way. */
const CACHE = "fifo-roster-v1.7";
const SHELL = [
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  // one missing file must not stop the whole service worker installing
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isPage = req.mode === "navigate" || /\.html($|\?)/.test(req.url);

  if (isPage) {
    // network first — always pick up a fresh build when there's signal
    e.respondWith(
      fetch(req)
        .then(res => {
          // never let a 404, a maintenance page or a captive portal become the app
          if (res && res.ok && res.type !== "opaque") {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put("./index.html", copy));
            return res;
          }
          return caches.match("./index.html").then(r => r || res);
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match(req)))
    );
    return;
  }

  // everything else — cache first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok && res.type !== "opaque") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => new Response("", { status: 504, statusText: "Offline" })))
  );
});
