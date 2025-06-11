const CACHE_NAME = 'dgnotes-cache-v1.0.12';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // add other assets here, e.g., CSS, JS bundles, icons...
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
