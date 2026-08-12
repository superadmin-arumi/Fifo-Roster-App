/* FIFO Roster service worker
   ---------------------------------------------------------------------------
   Site rule: the app must open instantly whether there is signal or not.

   This used to be network-first for the page, which is fine offline (the fetch
   fails fast and falls back to cache) but terrible on one bar: the request opens
   a socket and hangs, and the app sits on a blank screen until the connection
   finally gives up. A mine site is far more often "one bar" than "no bars".

   So the page is served from cache immediately, and a fresh copy is fetched in
   the background under a short timeout. A new build lands on the next launch,
   and the app is told so it can offer to reload. */

const CACHE = "fifo-roster-v2.2";
const PAGE = "./index.html";
const NET_TIMEOUT = 4000;

const SHELL = [
  PAGE,
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

/* never let a hanging socket become an unbounded wait */
function timedFetch(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(req).then(
      r => { clearTimeout(t); resolve(r); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

async function tellClients(msg) {
  const all = await self.clients.matchAll({ type: "window" });
  for (const c of all) { try { c.postMessage(msg); } catch (e) {} }
}

/* is this response a different build from the one we have cached? compare the
   validators the host sends rather than re-reading two megabytes of HTML */
function looksNew(fresh, cached) {
  if (!cached) return false;
  const a = fresh.headers.get("etag"), b = cached.headers.get("etag");
  if (a && b) return a !== b;
  const c = fresh.headers.get("last-modified"), d = cached.headers.get("last-modified");
  if (c && d) return c !== d;
  const e = fresh.headers.get("content-length"), f = cached.headers.get("content-length");
  if (e && f) return e !== f;
  return false;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isPage = req.mode === "navigate" || /\.html($|\?)/.test(req.url);

  if (isPage) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(PAGE);

      const refresh = timedFetch(req, NET_TIMEOUT).then(async res => {
        // never let a 404, a maintenance page or a café captive portal become the app
        if (!res || !res.ok || res.type === "opaque") return null;
        const isNew = looksNew(res, hit);
        await cache.put(PAGE, res.clone());
        if (hit && isNew) tellClients({ type: "update-ready" });
        return res;
      }).catch(() => null);

      // cached copy wins immediately — this is what makes one bar behave like no bars
      if (hit) { e.waitUntil(refresh); return hit; }

      const res = await refresh;
      return res || new Response(
        "<!doctype html><meta charset=utf-8><title>FIFO Roster</title>" +
        "<body style='font:16px system-ui;padding:40px'>Open this once with signal and it will work offline from then on.",
        { status: 503, headers: { "Content-Type": "text/html" } });
    })());
    return;
  }

  // everything else — cache first, refresh quietly
  e.respondWith(
    caches.match(req).then(hit => hit || timedFetch(req, NET_TIMEOUT).then(res => {
      if (res && res.ok && res.type !== "opaque") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => new Response("", { status: 504, statusText: "Offline" })))
  );
});
