// src/public/sw.js
// Injection point for VitePWA - manifest will be injected here during build
// @ts-ignore
const manifest = self.__WB_MANIFEST || [];

const CACHE_NAME = 'story-apps-cache-v1';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  OFFLINE_URL,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW Cache opened');
        // Cache manifest files if available (injected by VitePWA during build)
        const filesToCache = manifest.length > 0 
          ? [...urlsToCache, ...manifest.map((entry) => entry.url)]
          : urlsToCache;
        return cache.addAll(filesToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // App shell style offline handling
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the page for future offline use
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          return cachedResponse || cache.match(OFFLINE_URL);
        })
    );
    return;
  }

  // For other requests: cache-first fallback to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(async () => {
          // If request is for an image, return offline fallback image if available
          if (event.request.destination === 'image') {
            const cache = await caches.open(CACHE_NAME);
            const offlineImage = await cache.match('/story.png');
            if (offlineImage) return offlineImage;
          }
          // Otherwise, try offline page
          const cache = await caches.open(CACHE_NAME);
          return cache.match(OFFLINE_URL);
        });
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Service worker push event received');
  
  let notificationData = {
    title: 'Ada laporan baru untuk Anda!',
    body: 'Terjadi kerusakan lampu jalan di Jl. Melati',
    icon: '/story.png',
    badge: '/story.png',
    tag: 'story-notification',
    requireInteraction: false,
  };

  // Extract data from push event if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      if (pushData.title) notificationData.title = pushData.title;
      if (pushData.body) notificationData.body = pushData.body;
      if (pushData.icon) notificationData.icon = pushData.icon;
    } catch (e) {
      // If data is text, use it as body
      const textData = event.data.text();
      if (textData) {
        notificationData.body = textData;
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
