// 潮見帳 Service Worker
// キャッシュ名の数字を上げると、次回起動時に中身が入れ替わる
const CACHE = "shiomi-v9";

const CORE = [
  "./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png",
  "./shiomi_assets/marten_lantern.png",
  "./shiomi_assets/marten_arms.png",
  "./shiomi_assets/marten_sitting.png",
  "./shiomi_assets/marten_reaching.png",
  "./shiomi_assets/marten_writing.png",
  "./shiomi_assets/marten_reading.png",
  "./shiomi_assets/rabbit_happy.png",
  "./shiomi_assets/rabbit_tired.png",
  "./shiomi_assets/rabbit_down.png",
  "./shiomi_assets/rabbit_endure.png",
  "./shiomi_assets/pair.png",
  "./shiomi_assets/pair-1.png",
  "./shiomi_assets/pair-2.png",
  "./shiomi_assets/pair-3.png",
  "./shiomi_assets/pair-4.png",
  "./shiomi_assets/pair-5.png",
  "./shiomi_assets/pair-6.png",
  "./shiomi_assets/mood_good.png",
  "./shiomi_assets/mood_ok.png",
  "./shiomi_assets/mood_bad.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  // 一枚でも失敗すると全部落ちるので、個別に入れる
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(CORE.map(u => c.add(u).catch(() => {})))
  ));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  // フォント・画像は cache first（一度取れば以後はオフラインでも即座に出る）
  if (isFont || /\.(png|webp|jpg|svg)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // 本体は network first（更新を拾いつつ、圏外ではキャッシュに落ちる）
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
