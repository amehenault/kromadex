'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Images, Palette } from 'lucide-react';
import MissivesEpinglees from './missivesEpinglees';
import Fil from './fil';
import CodesCouleurs from './codesCouleurs';

// Communauté : missives épinglées en haut, puis le fil des coloriages et la recherche de codes couleurs
export default function Communaute({ monId, integre }) {
  const [onglet, setOnglet] = useState('fil');
  const ONGLETS = [['fil', 'Coloriages', Images], ['codes', 'Codes couleurs', Palette]];

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: integre ? 0 : 'var(--espace-3)' }}>
      {!integre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
          <Link href="/" className="btn alt" aria-label="Retour à l'accueil" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <ArrowLeft size={16} />
          </Link>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Communauté</h2>
        </div>
      )}

      <MissivesEpinglees monId={monId} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: 'var(--espace-3) 0' }}>
        {ONGLETS.map(([cle, label, Icone]) => (
          <button key={cle} type="button" onClick={() => setOnglet(cle)} className={onglet === cle ? 'btn' : 'btn alt'}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '46px', minWidth: 0 }}>
            <Icone size={18} /> {label}
          </button>
        ))}
      </div>

      {onglet === 'fil' ? <Fil /> : <CodesCouleurs />}
    </div>
  );
}
