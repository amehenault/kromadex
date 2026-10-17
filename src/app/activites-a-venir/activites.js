'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, Bell, BellOff, ChevronRight } from 'lucide-react';
import { quand } from '@/lib/planificationTexte';

const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
const versOctets = (base64) => {
  const b = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
};

// Notifications push sur cet appareil : un rappel par jour tant qu'une activité n'est pas planifiée
function Notifications({ clePublique, actif }) {
  const [etat, setEtat] = useState('verification'); // verification | indisponible | refusees | actives | inactives
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      if (!actif || !clePublique || !('serviceWorker' in navigator) || !('PushManager' in window)) { setEtat('indisponible'); return; }
      if (Notification.permission === 'denied') { setEtat('refusees'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      setEtat((await reg.pushManager.getSubscription()) ? 'actives' : 'inactives');
    })().catch(() => setEtat('indisponible'));
  }, [actif, clePublique]);

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
    setEtat('inactives');
  }

  const bouton = { minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 };
  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' }}>
      <b>Notifications sur cet appareil</b>
      {etat === 'indisponible' && <small style={{ color: 'var(--texte-secondaire)' }}>Les notifications ne sont pas disponibles ici (navigateur non compatible, ou clés de notification pas encore configurées). Sur iPhone, ajoute d’abord Kromadex à l’écran d’accueil.</small>}
      {etat === 'refusees' && <small style={{ color: 'var(--texte-secondaire)' }}>Les notifications sont bloquées pour Kromadex dans les réglages du navigateur.</small>}
      {etat === 'inactives' && <button type="button" className="btn" style={bouton} onClick={activer}><Bell size={18} aria-hidden="true" /> Activer les rappels quotidiens</button>}
      {etat === 'actives' && (
        <>
          <small style={{ color: 'var(--btn)', fontWeight: 700 }}>Activées : tu reçois un rappel chaque matin tant qu’une activité reste à planifier.</small>
          <button type="button" className="btn alt" style={bouton} onClick={desactiver}><BellOff size={18} aria-hidden="true" /> Désactiver sur cet appareil</button>
        </>
      )}
      {message && <small style={{ color: 'var(--danger)' }}>{message}</small>}
    </div>
  );
}

export default function ActivitesAVenir({ clePublique }) {
  const [donnees, setDonnees] = useState(null);

  useEffect(() => {
    fetch('/api/planification').then((r) => (r.ok ? r.json() : null)).then(setDonnees);
  }, []);

  const aPlanifier = (donnees?.activites || []).filter((a) => !a.planifiee);
  const planifiees = (donnees?.activites || []).filter((a) => a.planifiee);
  const ligne = (a) => (
    <Link key={a.cle} href={a.lien} className="carte"
      style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit', textDecoration: 'none', border: a.rappel ? '2px solid var(--danger)' : undefined, marginBottom: '8px' }}>
      {a.planifiee
        ? <CheckCircle2 size={22} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
        : <AlertTriangle size={22} aria-hidden="true" style={{ flex: '0 0 auto', color: a.rappel ? 'var(--danger)' : 'var(--texte-secondaire)' }} />}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <b style={{ overflowWrap: 'anywhere' }}>{a.nom}</b>
        {a.titre && <small style={{ overflowWrap: 'anywhere' }}>{a.titre}</small>}
        <small style={{ color: 'var(--texte-secondaire)' }}>Début : {jour(a.debut)} ({quand(a.jours)})</small>
        {a.rappel && <small style={{ color: 'var(--danger)', fontWeight: 700 }}>{a.texte}</small>}
      </span>
      <ChevronRight size={20} aria-hidden="true" style={{ flex: '0 0 auto' }} />
    </Link>
  );

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <Link href="/profil" className="btn alt" aria-label="Retour au profil" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Activités à venir</h2>
      </div>
      <p style={{ marginTop: 0, color: 'var(--texte-secondaire)', fontSize: '0.9rem' }}>
        Rappels : 2 semaines avant chaque mois pour l’épreuve mensuelle et les 2 bingos, 1 mois avant chaque expédition, 2 mois avant chaque épopée et avant la prophétie.
      </p>
      <Notifications clePublique={clePublique} actif={donnees?.push} />
      {!donnees && <p>Chargement…</p>}
      {aPlanifier.length > 0 && <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>À planifier</h3>}
      {aPlanifier.map(ligne)}
      {planifiees.length > 0 && <h3 style={{ margin: '16px 0 8px', fontSize: '1rem' }}>Planifiées</h3>}
      {planifiees.map(ligne)}
    </div>
  );
}
