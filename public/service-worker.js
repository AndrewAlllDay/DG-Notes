// public/service-worker.js

const CACHE_NAME = 'dgnotes-cache-v1.0.85';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // Add other static assets here that your app needs to function offline.
    // This typically includes your main JS bundle, CSS, and icons.
    // Example: '/assets/index-xxxxxxxx.js', '/assets/style-xxxxxxxx.css', '/DG Logo.svg'
    // You'll need to update these paths based on your build output.
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(urlsToCache);
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
                })
            );
        })
    );
    // Ensure the service worker takes control of clients immediately
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Check if the request is for an external API (like Firebase Firestore)
    // or if it's a POST request (which should generally go to the network).
    // Firestore requests will typically go to 'firestore.googleapis.com' or similar.
    const isFirebaseRequest = event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase.googleapis.com');

    if (event.request.method === 'POST' || isFirebaseRequest) {
        // For API calls or POST requests, go straight to the network.
        // This ensures real-time updates and data writes work correctly.
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('Service Worker: Network fetch failed for Firebase/POST request:', error);
                    // You might want to return an offline response or throw an error here.
                    // For now, it will just fail.
                    throw error;
                })
        );
    } else {
        // For other requests (e.g., static assets), use cache-first, then fall back to network.
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    // No cache hit - fetch from network
                    return fetch(event.request).then(
                        networkResponse => {
                            // Optionally, cache new static assets as they are fetched
                            // if they are not already in urlsToCache, but be careful
                            // with dynamic bundle names.
                            // caches.open(CACHE_NAME).then(cache => {
                            //     cache.put(event.request, networkResponse.clone());
                            // });
                            return networkResponse;
                        }
                    ).catch(error => {
                        console.error('Service Worker: Fetch failed for static asset:', error);
                        // Respond with a fallback HTML page for offline navigation if desired
                        // return caches.match('/offline.html');
                    });
                })
        );
    }
});