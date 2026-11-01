'use client';
import { useEffect, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import Defis from '@/app/defis/defis';
import Communaute from '@/app/communaute/communaute';
import RechercheAccueil from './RechercheAccueil';
import Podium from './Podium';

export default function AccueilOnglets({ monId }) {
  const [onglet, setOnglet] = useState('defis');

  useEffect(() => {
    try { const o = localStorage.getItem('kromadex-accueil'); if (o === 'defis' || o === 'communaute') setOnglet(o); } catch {}
  }, []);

  function choisir(o) {
    setOnglet(o);
    try { localStorage.setItem('kromadex-accueil', o); } catch {}
  }

  const [nouveautes, setNouveautes] = useState(0);
  useEffect(() => {
    const verifier = () => fetch('/api/activites-vues').then((r) => (r.ok ? r.json() : null)).then((d) => d && setNouveautes(d.total)).catch(() => {});
    verifier();
    window.addEventListener('kromadex-lu', verifier);
    return () => window.removeEventListener('kromadex-lu', verifier);
  }, []);

  const ONGLETS = [['defis', 'Activités', Trophy], ['communaute', 'Communauté', Users]];

  return (
    <>
      <RechercheAccueil />
      <Podium />
      <div role="tablist" aria-label="Accueil" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {ONGLETS.map(([cle, label, Icone]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} onClick={() => choisir(cle)}
            className={onglet === cle ? 'btn' : 'btn alt'}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '48px', fontWeight: 700, minWidth: 0, padding: '8px 6px', whiteSpace: 'nowrap', overflowWrap: 'normal' }}>
            <Icone size={18} aria-hidden="true" /> {label}
            {cle === 'defis' && nouveautes > 0 && <span className="pastille" aria-label="Nouveautés à voir" style={{ position: 'absolute', top: 6, right: 8 }} />}
          </button>
        ))}
      </div>
      {onglet === 'defis' ? <Defis monId={monId} integre /> : <Communaute monId={monId} integre />}
    </>
  );
}
