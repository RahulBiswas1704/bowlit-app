// A minimal service worker to satisfy PWA install requirements
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  // Pass-through fetch handler (required for some browsers to trigger PWA install)
  self.addEventListener('fetch', (event) => {
    // We aren't caching anything offline yet, just passing requests through
  });