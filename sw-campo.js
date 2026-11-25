// Cache do app de campo (campo.html): abre sem internet. As baixas ficam no banco offline do Firebase.
const V='torque-campo-v54';
const FILES=['campo.html','campo.webmanifest','icon-192.png','icon-512.png','fb.js','sync.js','firebase-config.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  const f=u.pathname.split('/').pop()||'';
  if(!FILES.includes(f)) return;   // o sistema do escritório não passa pelo cache
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
