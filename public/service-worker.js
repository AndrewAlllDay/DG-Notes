// IMPORTANT: Increment this CACHE_NAME any time you make changes to your app's code or assets
const CACHE_NAME = 'dgnotes-cache-v1.0.32'; // <-- I've incremented this for you

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                self.skipWaiting();
                console.log('Service Worker: Installation complete, skipping waiting.');
            })
            .catch(error => {
                console.error('Service Worker: Caching failed', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cache);
                        return caches.delete(cache);
                    }
                    return null;
                })
            );
        })
            .then(() => {
                console.log('Service Worker: Claiming clients...');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', event => {
    // The problematic share-handling 'if' block has been removed.
    // Now, the service worker will let the browser handle the share POST request,
    // which will correctly trigger the launchQueue API in App.jsx.

    const isFirebaseRequest = event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase.googleapis.com') ||
        event.request.url.includes('googleapis.com');

    if (event.request.method === 'POST' || isFirebaseRequest) {
        // Let network requests for POST and Firebase pass through
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('Service Worker: Network fetch failed for Firebase/POST request:', event.request.url, error);
                    throw error;
                })
        );
    } else if (event.request.url.startsWith(self.location.origin)) {
        // Serve static assets from cache first, then network
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then(networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                        return networkResponse;
                    }).catch(error => {
                        console.error('Service Worker: Fetch failed for static asset:', event.request.url, error);
                        return new Response('<h1>Offline</h1><p>Please check your internet connection.</p>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
                })
        );
    } else {
        // For any other cross-origin GET requests, just fetch from the network
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        console.log('Service Worker: Skip waiting message received from client.');
    }
});