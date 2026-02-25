// This service worker unregisters itself to fix frozen splash screens
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.claim())
  );
});
