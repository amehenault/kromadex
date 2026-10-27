'use client';
import { useEffect } from 'react';

const versOctets = (base64) => {
  const b = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
};

export const CLE_NOTIFS_DESACTIVEES = 'kromadex-notifs-desactivees';

export default function ReabonnementNotifications({ clePublique }) {
  useEffect(() => {
    (async () => {
      if (!clePublique || !('serviceWorker' in navigator) || !('PushManager' in window) || Notification.permission !== 'granted') return;
      try { if (localStorage.getItem(CLE_NOTIFS_DESACTIVEES)) return; } catch {}
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const abonnement = (await reg.pushManager.getSubscription())
        || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: versOctets(clePublique) });
      await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(abonnement.toJSON()) });
    })().catch(() => {});
  }, [clePublique]);
  return null;
}
