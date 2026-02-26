// A minimal service worker to satisfy PWA install requirements
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });
  
  // Pass-through fetch handler
  self.addEventListener('fetch', (event) => {
    // We aren't caching anything offline yet, just passing requests through
  });
  
  // NEW: Handle Background Push Notifications
  self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'BowlIt Update 🍲';
    const options = {
      body: data.body || 'Your meal status has been updated!',
      icon: '/logo1.svg',
      badge: '/logo1.svg',
      vibrate: [200, 100, 200, 100, 200], // Phone vibration pattern
      data: {
        url: data.url || '/' // Where to take the user when they click it
      }
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
  });
  
  // NEW: Handle clicking on the notification
  self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification
    
    // Open the app to the URL specified in the notification data
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  });