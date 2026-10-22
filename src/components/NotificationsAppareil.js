'use client';
import { useAccord } from '@/components/Genre';
import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { CLE_NOTIFS_DESACTIVEES } from './ReabonnementNotifications';

const versOctets = (base64) => {
  const b = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
};

// Activer ou désactiver les notifications push sur l'appareil utilisé (téléphone, tablette, ordinateur)
export default function NotificationsAppareil({ clePublique }) {
  const acc = useAccord(); // accord au genre de la personne connectée (le féminin prime)
  const [etat, setEtat] = useState('verification'); // verification | indisponible | refusees | actives | inactives
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      if (!clePublique || !('serviceWorker' in navigator) || !('PushManager' in window)) { setEtat('indisponible'); return; }
      if (Notification.permission === 'denied') { setEtat('refusees'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      setEtat((await reg.pushManager.getSubscription()) ? 'actives' : 'inactives');
    })().catch(() => setEtat('indisponible'));
  }, [clePublique]);

  async function activer() {
    setMessage('');
    try {
      if ((await Notification.requestPermission()) !== 'granted') { setEtat('refusees'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const abonnement = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: versOctets(clePublique) });
      const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(abonnement.toJSON()) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
      setEtat('actives');
      try { localStorage.removeItem(CLE_NOTIFS_DESACTIVEES); } catch {}
      // Notification d'essai pour confirmer que tout fonctionne
      await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ essai: true }) });
    } catch (e) { setMessage(e.message || 'Impossible d’activer les notifications sur cet appareil.'); }
  }

  async function desactiver() {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const abonnement = await reg?.pushManager.getSubscription();
    if (abonnement) {
      await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: abonnement.endpoint }) });
      await abonnement.unsubscribe();
    }
    // Choix de la personne : pas de réabonnement automatique à la prochaine connexion sur cet appareil
    try { localStorage.setItem(CLE_NOTIFS_DESACTIVEES, '1'); } catch {}
    setEtat('inactives');
  }

  const bouton = { minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 };
  const aide = { color: 'var(--texte-secondaire)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {etat === 'indisponible' && (
        <small style={aide}>
          Les notifications ne sont pas disponibles ici. Sur iPhone, ajoute d’abord Kromadex à l’écran d’accueil avec Safari (iOS 16.4 ou plus récent), puis ouvre l’appli depuis son icône.
        </small>
      )}
      {etat === 'refusees' && (
        <small style={aide}>Les notifications sont bloquées pour Kromadex. Autorise-les dans les réglages de ton téléphone ou de ton navigateur, puis reviens ici.</small>
      )}
      {etat === 'inactives' && (
        <>
          <button type="button" className="btn" style={bouton} onClick={activer}><Bell size={18} aria-hidden="true" /> Activer les notifications sur cet appareil</button>
          {/* Mémo pour donner envie d'activer les notifications */}
          <small style={{ ...aide, background: 'var(--accent-doux)', borderRadius: 'var(--rayon-m)', padding: '10px 12px', lineHeight: 1.45 }}>
            <b style={{ color: 'var(--texte-principal)' }}>Ne rate plus rien de Kromadex !</b> Sois {acc('prévenue', 'prévenu')} dès qu’une nouvelle missive arrive,
            qu’on t’invite en duel ou que l’Invocatrice répond à ta demande. Tu choisis exactement ce que tu reçois,
            et tu peux tout désactiver en un geste.
          </small>
        </>
      )}
      {etat === 'actives' && (
        <>
          <small style={{ color: 'var(--accent-primaire)', fontWeight: 700 }}>Activées sur cet appareil.</small>
          <button type="button" className="btn alt" style={bouton} onClick={desactiver}><BellOff size={18} aria-hidden="true" /> Désactiver sur cet appareil</button>
        </>
      )}
      {message && <small style={{ color: 'var(--danger)' }}>{message}</small>}
    </div>
  );
}
