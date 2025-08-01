// IMPORTANT: Increment this CACHE_NAME any time you make changes
const CACHE_NAME = 'dgnotes-cache-v1.0.30'; // Reverted to an older version name

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Helper functions for IndexedDB to temporarily store the shared file.
function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dgnotes-shared-files', 1);
        request.onerror = event => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = event => resolve(event.target.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
        };
    });
}

async function saveFile(file) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.put({ file: file, timestamp: new Date() });
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}

self.addEventListener('install', event => {
    // Standard install logic...
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    // Standard activate logic...
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                    return null;
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // This is the old share handling logic that will be re-introduced
    if (event.request.method === 'POST' && url.pathname === '/share-receiver.html') {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                const file = formData.get('csvfile'); // 'csvfile' is the name from manifest.json
                if (file) {
                    await saveFile(file);
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

    // Standard cache/network logic for other requests...
    const isFirebaseRequest = url.hostname.includes('firestore.googleapis.com');
    if (event.request.method === 'POST' || isFirebaseRequest) {
        event.respondWith(fetch(event.request));
    } else if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(networkResponse => {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
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
    }
});