self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { texte: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(d.titre || 'Kromadex', {
    body: d.texte || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { lien: d.lien || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const lien = (event.notification.data && event.notification.data.lien) || '/';
  event.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const f of fenetres) {
      if ('focus' in f) { await f.navigate(lien).catch(() => {}); return f.focus(); }
    }
    return self.clients.openWindow(lien);
  })());
});
