// NestCharge Service Worker v1
const CACHE_NAME = 'nestcharge-v1';

// ── INSTALL ──
self.addEventListener('install', event => {
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  self.clients.claim();
});

// ── PUSH NOTIFICATION RECEIVED ──
self.addEventListener('push', event => {
  let data = {
    title: 'NestCharge ⚡',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    url: '/bookings.html'
  };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch (e) { data.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      tag: data.tag || 'nestcharge',
      data: { url: data.url || '/bookings.html' },
      vibrate: [100, 50, 100],
      requireInteraction: false
    })
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/bookings.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
