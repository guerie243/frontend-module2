// Service Worker pour les notifications Web Push
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'Nouvelle notification',
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png',
        data: data.data || {},
        vibrate: [200, 100, 200],
        tag: data.tag || 'notification'
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    // Ouvrir ou focus la fenêtre de l'app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Si une fenêtre est déjà ouverte, la focus
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Sinon, ouvrir une nouvelle fenêtre
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

const CACHE_NAME = 'andy-business-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.png',
    '/favicon.png'
];

// Installation du Service Worker et mise en cache des ressources de base
self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('[Service Worker] Mise en cache des ressources...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activation...');
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Stratégie de cache : Network First avec fallback sur le cache
self.addEventListener('fetch', function (event) {
    // Ne pas intercepter les requêtes API ou externes si nécessaire
    if (event.request.url.includes('/api/') || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // Si la réponse est valide, on la met en cache
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(function () {
                // Si le réseau échoue, on regarde dans le cache
                return caches.match(event.request);
            })
    );
});
