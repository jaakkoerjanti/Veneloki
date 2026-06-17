// Veneloki – service worker
// Tallentaa sovelluksen tiedostot laitteelle, jotta se toimii ilman nettiä.
// Nosta versionumeroa aina kun päivität sovellusta, niin vanha välimuisti vaihtuu.
const CACHE = "veneloki-v9";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./apple-touch-icon.png",
  "./aquador.png",
  "./icon-192.png",
  "./icon-512.png"
];

// Asennus: lataa kaikki tiedostot välimuistiin
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktivointi: siivoa vanhat välimuistit pois
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Haku: yritä ensin verkosta, ja jos ei onnistu, tarjoa välimuistista.
// Päivitä samalla välimuisti uusimmalla versiolla (stale-while-revalidate).
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
