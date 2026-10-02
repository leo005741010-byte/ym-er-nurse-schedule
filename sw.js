// 楊梅天成急診護理排班 Service Worker
const CACHE='ym-er-nurse-shift-v4';
const CORE=['./','./index.html','./manifest.json',
            './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{})));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return; // Firebase/CDN 等跨網域請求直通

  // HTML 導覽：network-first（優先拿最新版），離線退回快取
  if(req.mode==='navigate' || (req.headers.get('accept')||'').includes('text/html')){
    e.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // 其他靜態資源：cache-first
  e.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return res;
    }).catch(()=>cached))
  );
});
