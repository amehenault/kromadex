'use client';
import { useEffect, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import Defis from '@/app/defis/defis';
import Communaute from '@/app/communaute/communaute';

// Onglets de l'accueil : Épreuves et Communauté (le dernier onglet choisi est retenu sur l'appareil)
export default function AccueilOnglets({ monId }) {
  const [onglet, setOnglet] = useState('defis');

  useEffect(() => {
    try { const o = localStorage.getItem('kromadex-accueil'); if (o === 'defis' || o === 'communaute') setOnglet(o); } catch {}
  }, []);

  function choisir(o) {
    setOnglet(o);
    try { localStorage.setItem('kromadex-accueil', o); } catch {}
  }

  const ONGLETS = [['defis', 'Épreuves', Trophy], ['communaute', 'Communauté', Users]];

  return (
    <>
      <div role="tablist" aria-label="Accueil" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: 'var(--espace-3)' }}>
        {ONGLETS.map(([cle, label, Icone]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} onClick={() => choisir(cle)}
            className={onglet === cle ? 'btn' : 'btn alt'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '48px', fontWeight: 700, minWidth: 0, padding: '8px 6px', whiteSpace: 'nowrap', overflowWrap: 'normal' }}>
            <Icone size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {onglet === 'defis' ? <Defis monId={monId} integre /> : <Communaute monId={monId} integre />}
    </>
  );
}
