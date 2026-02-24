const CACHE_NAME = 'chargespot-v3';
const OFFLINE_URL = '/index.html';

const PRECACHE = [
  '/index.html',
  '/status.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// ── INSTALL ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE.filter(url => !url.startsWith('http')));
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH (offline fallback) ──
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'A charging slot just opened up near you!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/', chargerId: data.chargerId },
    actions: [
      { action: 'book', title: '⚡ Book Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'chargespot-' + (data.chargerId || 'general'),
    renotify: true
  };
  event.waitUntil(
    self.registration.showNotification(data.title || '⚡ ChargeSpot Alert', options)
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
});

async function syncOfflineBookings() {
  // When back online, retry any failed bookings stored in IndexedDB
  const db = await openDB();
  const tx = db.transaction('offline_bookings', 'readwrite');
  const store = tx.objectStore('offline_bookings');
  const items = await store.getAll();
  for (const item of items) {
    try {
      await fetch('/api/bookings', { method: 'POST', body: JSON.stringify(item) });
      await store.delete(item.id);
    } catch(e) {}
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('chargespot', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('offline_bookings', { keyPath: 'id' });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}
