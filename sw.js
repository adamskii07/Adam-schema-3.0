const CACHE='adam-schema-offline-v2';
const FILES=['./','./index.html','./style.css','./schedule.js','./app.js?v=2','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('adam-schema-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{try{const r=await fetch(e.request);if(r.ok)await c.put(e.request,r.clone());return r;}catch(err){return (await c.match(e.request))||(e.request.mode==='navigate'?await c.match('./index.html'):Response.error());}}));});
