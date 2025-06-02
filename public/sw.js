const CACHE_NAME = 'muistimestari-app-v1';  // New app name and reset version
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/female-greeting.mp3',
  '/icons/favicon.ico',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Static resources cached');
      })
  );
});

// Activate event - clean old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and claimed all clients');
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response since it's a stream
            const responseToCache = response.clone();

            // Cache successful responses for static assets
            if (STATIC_CACHE_URLS.includes(new URL(event.request.url).pathname)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Message handler for update commands
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker skipping waiting phase');
    // Force immediate activation
    self.skipWaiting().then(() => {
      console.log('skipWaiting completed, now claiming clients');
      // Explicitly claim clients to ensure the update takes effect
      self.clients.claim().then(() => {
        console.log('All clients claimed by new service worker');
        
        // Notify all clients that the worker has been updated
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED' });
          });
        });
      });
    });
  }
});

// Background sync for offline uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-audio') {
    console.log('Background sync: upload-audio');
    event.waitUntil(
      // Handle offline audio uploads when connection is restored
      self.registration.showNotification('Työkalu App', {
        body: 'Yhteys palautettu. Voit jatkaa äänikeskustelua.',
        icon: '/icons/maskable-192.png'
      })
    );
  }
  
  if (event.tag === 'upload-file' || event.tag === 'upload-photo') {
    console.log('Background sync:', event.tag);
    event.waitUntil(
      // Handle offline file uploads when connection is restored
      self.registration.showNotification('Työkalu App', {
        body: 'Yhteys palautettu. Tiedostot lähetetään.',
        icon: '/icons/maskable-192.png'
      })
    );
  }
});
