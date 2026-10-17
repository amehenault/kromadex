'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import NotificationsAppareil from '@/components/NotificationsAppareil';
import { quand } from '@/lib/planificationTexte';

const jour = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

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
      {/* Rappel chaque matin tant qu'une activité reste à planifier (réglable dans Paramètres) */}
      <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--espace-3)' }}>
        <b>Rappels sur cet appareil</b>
        <NotificationsAppareil clePublique={clePublique} />
        <Link href="/parametres" style={{ color: 'inherit', fontWeight: 600, fontSize: '0.85rem', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Choisir mes notifications dans Paramètres</Link>
      </div>
      {!donnees && <p>Chargement…</p>}
      {aPlanifier.length > 0 && <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>À planifier</h3>}
      {aPlanifier.map(ligne)}
      {planifiees.length > 0 && <h3 style={{ margin: '16px 0 8px', fontSize: '1rem' }}>Planifiées</h3>}
      {planifiees.map(ligne)}
    </div>
  );
}
