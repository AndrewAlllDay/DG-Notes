// IMPORTANT: Increment this CACHE_NAME any time you make changes to your app's code or assets
const CACHE_NAME = 'dgnotes-cache-v1.0.25'; // <-- We will increment this again before the final deploy
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
];

// --- NEW HELPER FUNCTIONS FOR INDEXEDDB ---
// This is a simple in-browser database to temporarily store the shared file.
function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dgnotes-shared-files', 1);
        request.onerror = event => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = event => resolve(event.target.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            // Create a 'store' for our files
            db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
        };
    });
}

async function saveFile(file) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        // We'll store the file with a timestamp
        const request = store.put({ file: file, timestamp: new Date() });
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}
// --- END OF NEW HELPER FUNCTIONS ---


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
    const url = new URL(event.request.url);

    // --- NEW LOGIC TO INTERCEPT SHARED FILES ---
    if (event.request.method === 'POST' && url.pathname === '/share-receiver.html') {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                const file = formData.get('csvfile'); // 'csvfile' is the name from manifest.json
                if (file) {
                    await saveFile(file);
                    console.log('Service Worker: Shared file saved to IndexedDB.');
                }
                // After saving, redirect the user into the main app with a flag.
                return Response.redirect('/?share-target=true', 303);
            } catch (error) {
                console.error('Service Worker: Error handling shared file:', error);
                // In case of error, still redirect but with an error flag.
                return Response.redirect('/?share-target-error=true', 303);
            }
        })());
        return; // Stop further processing for this request
    }
    // --- END OF NEW LOGIC ---

    const isFirebaseRequest = event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebase.googleapis.com') ||
        event.request.url.includes('googleapis.com');

    if (event.request.method === 'POST' || isFirebaseRequest) {
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('Service Worker: Network fetch failed for Firebase/POST request:', event.request.url, error);
                    throw error;
                })
        );
    } else if (event.request.url.startsWith(self.location.origin)) {
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
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
        console.log('Service Worker: Skip waiting message received from client.');
    }
});