// public/service-worker.js

// IMPORTANT: Increment this CACHE_NAME any time you make changes to your app's code or assets
// that you want users to see immediately. This forces the browser to download new assets.
// You should match this with your APP_VERSION in SettingsPage.jsx for consistency if you have one.
const CACHE_NAME = 'dgnotes-cache-v1.0.105'; // <-- INCREMENT THIS VERSION FOR NEW DEPLOYMENTS!
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // Add other static assets here that your app needs to function offline.
    // This typically includes your main JS bundle, CSS, and icons.
    // Example: '/assets/index-xxxxxxxx.js', '/assets/style-xxxxxxxx.css', '/DG Logo.svg'
    // You'll need to update these paths based on your build output if they are hashed.
    // If your build process renames assets, consider adding a network-first strategy
    // or using a build-time manifest to generate this list. For simplicity,
    // assuming React's default bundling includes index.html and root paths.
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
                // IMPORTANT: This tells the new service worker to activate immediately
                // after it finishes installing, without waiting for all active tabs to close.
                // This is crucial for the "update on refresh" or "prompt to refresh" strategy.
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
                // Ensures the new service worker takes control of all clients (tabs) immediately.
                // This is necessary for the update prompt to work effectively when the user refreshes.
                console.log('Service Worker: Claiming clients...');
                return self.clients.claim();
            })
    );
});

self.addEventListener('fetch', event => {
    const isFirebaseRequest = event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase.googleapis.com') ||
        event.request.url.includes('googleapis.com'); // Broader check for Google APIs

    if (event.request.method === 'POST' || isFirebaseRequest) {
        // For API calls (especially Firebase) or POST requests, always go to the network first.
        // This ensures real-time updates and data writes work correctly without being cached.
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('Service Worker: Network fetch failed for Firebase/POST request:', event.request.url, error);
                    throw error; // Re-throw to propagate error to client
                })
        );
    } else if (event.request.url.startsWith(self.location.origin)) {
        // For other same-origin GET requests (e.g., static assets, HTML pages), use cache-first.
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    // No cache hit - fetch from network
                    return fetch(event.request).then(networkResponse => {
                        // Check if we received a valid response before caching
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Important: Clone the response. A response is a stream and can only be consumed once.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                        return networkResponse;
                    }).catch(error => {
                        console.error('Service Worker: Fetch failed for static asset:', event.request.url, error);
                        // You could return an offline fallback page here if desired.
                        return new Response('<h1>Offline</h1><p>Please check your internet connection.</p>', {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    });
                })
        );
    } else {
        // For cross-origin requests (e.g., external images, fonts), just fetch from network.
        event.respondWith(fetch(event.request));
    }
});

// NEW: Listen for messages from the client (App.jsx) to skip waiting.
// This allows your React app to tell the Service Worker to activate immediately.
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        console.log('Service Worker: Skip waiting message received from client.');
    }
});
