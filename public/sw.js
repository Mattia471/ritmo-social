/* Ritmo Social Web Push service worker. Scope: this site's origin only. */
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'Ritmo Social', body: 'Hai una nuova notifica.', url: '/notifications' }; }
  const title = typeof payload.title === 'string' ? payload.title.slice(0, 150) : 'Ritmo Social';
  const body = typeof payload.body === 'string' ? payload.body.slice(0, 350) : 'Nuovo aggiornamento della community.';
  const target = typeof payload.url === 'string' && /^\/(?:event\/[a-f0-9-]{36}|my-events|notifications)(?:\/?$)/i.test(payload.url)
    ? payload.url : '/notifications';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 80) : 'ritmo-notice',
    renotify: false,
    data: { target },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const path = event.notification.data?.target || '/notifications';
  const destination = new URL(path, self.location.origin);
  if (destination.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(destination.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(destination.href);
  })());
});
