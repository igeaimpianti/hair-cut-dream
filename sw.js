const CACHE="hair-cut-dream-v61";

const ASSETS=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./banner-haircutdream.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate",e=>
  e.waitUntil(
    Promise.all([
      caches.keys().then(ks=>
        Promise.all(
          ks.filter(k=>k!==CACHE)
            .map(k=>caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  )
);

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;

  const u=new URL(e.request.url);

  if(
    e.request.mode==="navigate" ||
    u.pathname.endsWith("/index.html") ||
    u.pathname.endsWith("/sw.js")
  ){
    e.respondWith(
      fetch(e.request,{cache:"no-store"})
        .then(r=>{
          const c=r.clone();
          caches.open(CACHE).then(x=>x.put(e.request,c));
          return r;
        })
        .catch(()=>
          caches.match(e.request)
            .then(r=>r||caches.match("./index.html"))
        )
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(r=>{
        const c=r.clone();
        caches.open(CACHE).then(x=>x.put(e.request,c));
        return r;
      })
      .catch(()=>caches.match(e.request))
  );
});

self.addEventListener("push",e=>
  e.waitUntil(
    (async()=>{
      let d={};

      try{
        d=e.data ? e.data.json() : {};
      }catch{
        d={
          body:e.data
            ? e.data.text()
            : "Nuovo aggiornamento"
        };
      }

      await self.registration.showNotification(
        d.title || "Hair Cut Dream",
        {
          body:d.body || "Hai un nuovo aggiornamento.",
          icon:"./icon-192.png",
          badge:"./icon-192.png",

          tag:d.tag || ("hcd-"+Date.now()),

          data:{
            url:d.url || "./",
            type:d.type || "",
            order_id:d.order_id || null
          }
        }
      );
    })()
  )
);

self.addEventListener("notificationclick",e=>{
  e.notification.close();

  e.waitUntil(
    (async()=>{
      const target=new URL(
        e.notification.data?.url || "./",
        self.registration.scope
      ).href;

      const windows=await clients.matchAll({
        type:"window",
        includeUncontrolled:true
      });

      for(const client of windows){
        if(client.url.startsWith(self.location.origin)){
          try{
            await client.navigate(target);
          }catch{}

          return client.focus();
        }
      }

      return clients.openWindow
        ? clients.openWindow(target)
        : null;
    })()
  );
});
