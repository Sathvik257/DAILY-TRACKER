/* Daily Tracker reminder service worker */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SHOW_REMINDER') {
    event.waitUntil(
      self.registration.showNotification(data.title || 'Daily Tracker', {
        body: data.body || 'Time for your daily check-in.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: data.tag || 'daily-tracker-reminder',
        renotify: true,
        data: { url: '/' },
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
