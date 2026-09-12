const CACHE = "hair-cut-dream-v56";
const APP_VERSION = "5.6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./banner-haircutdream.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(err => {
      console.error("SW cache install error", err);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/sw.js")
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", event => {
  event.waitUntil((async () => {
    let data = {};
    try {
      data = event.data ? event.data.json() : {};
    } catch (_) {
      data = { body: event.data ? event.data.text() : "Nuovo aggiornamento Hair Cut Dream" };
    }

    const title = data.title || "Hair Cut Dream";
    const options = {
      body: data.body || "Hai un nuovo aggiornamento nel gestionale.",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: data.tag || ("hair-cut-dream-" + Date.now()),
      renotify: true,
      requireInteraction: false,
      data: {
        url: data.url || "./",
        type: data.type || "",
        version: APP_VERSION
      }
    };

    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || "./", self.registration.scope).href;
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of windows) {
      if (client.url.startsWith(self.location.origin)) {
        if ("navigate" in client) {
          try { await client.navigate(target); } catch (_) {}
        }
        if ("focus" in client) return client.focus();
      }
    }

    if (clients.openWindow) return clients.openWindow(target);
  })());
});
