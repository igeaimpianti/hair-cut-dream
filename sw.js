const CACHE = "hair-cut-dream-v63";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./banner-haircutdream.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE)
            .map(k => caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  if (
    e.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/sw.js")
  ) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return response;
        })
        .catch(() =>
          caches.match(e.request)
            .then(r => r || caches.match("./index.html"))
        )
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener("push", e => {
  e.waitUntil(
    (async () => {
      let data = {};

      try {
        data = e.data ? e.data.json() : {};
      } catch {
        data = {
          body: e.data ? e.data.text() : "Nuovo aggiornamento"
        };
      }

      await self.registration.showNotification(
        data.title || "Hair Cut Dream",
        {
          body: data.body || "Hai un nuovo aggiornamento.",
          icon: "./icon-192.png",
          badge: "./icon-192.png",
          tag: data.tag || ("hcd-" + Date.now()),
          data: {
            url: data.url || "./",
            type: data.type || "",
            order_id: data.order_id || null,
            notification_id: data.notification_id || null
          }
        }
      );
    })()
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();

  e.waitUntil(
    (async () => {
      const target = new URL(
        e.notification.data?.url || "./",
        self.registration.scope
      ).href;

      const windows = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of windows) {
        if (client.url.startsWith(self.location.origin)) {
          try {
            await client.navigate(target);
          } catch {}

          return client.focus();
        }
      }

      return clients.openWindow
        ? clients.openWindow(target)
        : null;
    })()
  );
});
