const CACHE = 'liturgia-osm-v4.9.8';
const CORE = [
  "./",
  "./index.html",
  "./servite.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./data/santoral.json",
  "./data/oficios-osm.json",
  "./data/hoje-familia-servita.json",
  "./media/servite-01.jpg",
  "./media/servite-02.webp",
  "./media/servite-03.jpg",
  "./media/servite-04.jpg",
  "./media/servite-05.jpg",
  "./media/servite-06.jpg",
  "./media/servite-07.jpg",
  "./media/servite-08.jpg",
  "./media/servite-09.jpg",
  "./media/servite-10.jpg",
  "./media/servite-11.jpg",
  "./media/servite-12.jpg",
  "./media/servite-13.png"
];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('liturgia-osm-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;})));});
