/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'conjugator-cache-v12';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.css',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
    'https://i.postimg.cc/c1T2NJgV/avma.png',
    'https://i.postimg.cc/tTP1GZL1/Tradicon-Logo-5-0.png',
    'https://i.postimg.cc/PxFS9cn1/Tradicon-Favicon.png'
];

// Install event: cache the application shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => {
                console.error('Failed to open cache and add assets:', err);
            })
    );
});

// Fetch event: serve from cache, fall back to network, and cache new assets
self.addEventListener('fetch', event => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }
    
    // For API calls (or other resources we don't want to cache), fetch from network.
    // Example: if (event.request.url.includes('api.example.com')) { ... }
    
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                // If the resource is in the cache, serve it.
                if (response) {
                    return response;
                }

                // If the resource is not in the cache, fetch it from the network.
                return fetch(event.request).then(networkResponse => {
                    // Check if we received a valid response
                    if (networkResponse && networkResponse.status === 200) {
                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();
                        
                        // Cache the fetched resource.
                        cache.put(event.request, responseToCache);
                    }
                    
                    return networkResponse;
                });
            }).catch(error => {
                // This will be triggered if both cache and network fail.
                console.error('Fetch failed; returning offline page instead.', error);
                // Optionally, return a fallback offline page.
                // return caches.match('/offline.html');
            });
        })
    );
});


// Activate event: clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});