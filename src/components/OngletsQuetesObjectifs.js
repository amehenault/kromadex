'use client';
import { useState } from 'react';
import { Dices, Target } from 'lucide-react';
import QuetesDuDestin from './QuetesDuDestin';
import ObjectifsPerso from './ObjectifsPerso';

// Deux onglets côte à côte : Mes quêtes du Destin et Mes objectifs.
export default function OngletsQuetesObjectifs({ destin, objectifs, bibliotheque }) {
  const enCours = objectifs.filter((o) => !o.termine_le).length;
  const [onglet, setOnglet] = useState(destin.length || !enCours ? 'destin' : 'objectifs');
  const ONGLETS = [['destin', 'Mes quêtes du Destin', Dices, destin.length], ['objectifs', 'Mes objectifs', Target, enCours]];
  return (
    <div style={{ marginBottom: 'var(--espace-3)' }}>
      <div role="tablist" aria-label="Quêtes et objectifs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
        {ONGLETS.map(([cle, label, Icone, n]) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} onClick={() => setOnglet(cle)} className={onglet === cle ? 'btn' : 'btn alt'}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', minHeight: '58px', padding: '6px 4px', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, minWidth: 0, overflowWrap: 'normal', wordBreak: 'normal' }}>
            <Icone size={18} aria-hidden="true" /> {label}{n ? ` (${n})` : ''}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {onglet === 'destin'
          ? <QuetesDuDestin quetes={destin} titre="Mes quêtes du Destin" sansTitre />
          : <ObjectifsPerso objectifs={objectifs} bibliotheque={bibliotheque} sansTitre />}
      </div>
    </div>
  );
}
