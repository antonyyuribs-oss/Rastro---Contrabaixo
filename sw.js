const CACHE='baixo-v5';
const STATIC=['./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));return response})));
});
