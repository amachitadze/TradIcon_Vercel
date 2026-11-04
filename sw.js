/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'tradicon-network-first-v14';
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

// Install event: cache application shell and activate immediately
self.addEventListener('install', event => {
    self.skipWaiting(); // მომენტალური გააქტიურება
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .catch(err => console.error('Failed to pre-cache assets:', err))
    );
});

// Activate event: clean up all old caches and claim clients immediately
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('ძველი ქეშის წაშლა:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event: NETWORK-FIRST სტრატეგია
// ყოველთვის ჯერ ქსელიდან (Vercel-დან) მოაქვს უახლესი ვერსია, ხოლო ოფლაინ რეჟიმში იყენებს ქეშს
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);

    // API მოთხოვნებს (Groq, OpenRouter, Google) არასდროს ვკეშირებთ
    if (requestUrl.hostname.includes('googleapis.com') ||
        requestUrl.hostname.includes('groq.com') ||
        requestUrl.hostname.includes('openrouter.ai')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // თუ ქსელი გათიშულია, ვუბრუნებთ ქეშირებულ ვერსიას
                return caches.match(event.request);
            })
    );
});