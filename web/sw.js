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

// Installation du Service Worker
self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installation...');
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activation...');
    event.waitUntil(clients.claim());
});
