'use client';
import { useState } from 'react';
import { Award, ChevronRight } from 'lucide-react';
import Feuille from './Feuille';
import { IconeRecompense, LigneRecompense } from './Recompense';
import { regrouperRecompenses, nomRecompense } from '@/lib/recompenses';

// Les 3 récompenses les plus prestigieuses, et le détail complet avec « Voir plus »
// vide : texte affiché quand il n'y a encore aucune récompense (sinon l'encadré est caché)
export default function MesRecompenses({ recompenses, titre = 'Mes récompenses', vide }) {
  const [tout, setTout] = useState(false);
  if (!recompenses?.length) {
    if (!vide) return null;
    return (
      <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {titre}</h3>
        <small style={{ color: 'var(--texte-secondaire)' }}>{vide}</small>
      </section>
    );
  }
  const groupes = regrouperRecompenses(recompenses);

  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {titre}</h3>
        <button type="button" onClick={() => setTout(true)}
          style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', minHeight: '44px', fontWeight: 700, fontSize: '0.85rem' }}>
          Voir plus <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        {groupes.slice(0, 3).map((g) => (
          <div key={`${g.genre}|${g.detail}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center', minWidth: 0 }}>
            <IconeRecompense r={g} taille={56} />
            <small style={{ fontWeight: 600, overflowWrap: 'anywhere', fontSize: '0.75rem' }}>{nomRecompense(g, g.nombre)}</small>
          </div>
        ))}
      </div>
      {tout && (
        <Feuille titre={titre} onFermer={() => setTout(false)}>
          {groupes.map((g) => <LigneRecompense key={`${g.genre}|${g.detail}`} r={g} nombre={g.nombre} />)}
        </Feuille>
      )}
    </section>
  );
}
