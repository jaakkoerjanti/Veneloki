// Veneloki – service worker
// Tallentaa sovelluksen tiedostot laitteelle, jotta se toimii ilman nettiä.
// Nosta versionumeroa aina kun päivität sovellusta, niin vanha välimuisti vaihtuu.
const CACHE = "veneloki-v30";

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

// Haku: NETWORK-FIRST. Netissä haetaan aina tuorein versio ja päivitetään välimuisti.
// Jos verkko ei vastaa 2,5 s sisällä (heikko signaali) tai puuttuu (offline), tarjotaan välimuistista.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const network = fetch(e.request).then((res) => {
    if (res && res.status === 200 && res.type === "basic") {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return res;
  }).catch(() => null);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
  e.respondWith(
    Promise.race([network, timeout]).then((res) =>
      res || caches.match(e.request).then((c) => c || caches.match("./index.html"))
    )
  );
});
