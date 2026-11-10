const C='monegros-v3';
const F=["./","index.html","app.js","plan.js","data.js","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
// fotos: primero caché · resto: primero red (las mejoras llegan solas) y caché si no hay cobertura
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin&&u.pathname.includes('/img/')){e.respondWith(caches.match(r).then(x=>x||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;})));return;}
 e.respondWith(fetch(r).then(res=>{if(res.ok&&(u.origin===location.origin||u.host.includes('fonts.g'))){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match(r,{ignoreSearch:true})));});
// precarga de las fotos del plan para usar la app sin cobertura en el gimnasio
self.addEventListener('message',e=>{if(e.data&&e.data.fotos)caches.open(C).then(c=>Promise.all(e.data.fotos.map(f=>c.match(f).then(x=>x||c.add(f).catch(()=>{}))))); });
