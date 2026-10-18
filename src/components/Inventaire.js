'use client';
import { useState } from 'react';
import { Backpack } from 'lucide-react';
import Feuille from './Feuille';
import { IconeRecompense } from './Recompense';
import { regrouperRecompenses, RECOMPENSES } from '@/lib/recompenses';

// Inventaire du profil : objets pas encore utilisés (ex. Parchemins du Destin), regroupés.
// « 3x Parchemin du Destin » quand on en a plusieurs ; toucher un objet ouvre sa description.
export default function Inventaire({ objets }) {
  const [ouvert, setOuvert] = useState(null);
  const groupes = regrouperRecompenses(objets || []);
  const nom = (g) => `${RECOMPENSES[g.genre]?.nom || ''}${g.detail ? ` ${g.detail}` : ''}`;
  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Backpack size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Inventaire
      </h3>
      {groupes.length
        ? groupes.map((g) => (
          <button key={`${g.genre}|${g.detail}`} type="button" onClick={() => setOuvert(g)}
            style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '72px', minWidth: 0 }}>
            <IconeRecompense r={g} taille={64} carre />
            <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontWeight: 600, fontSize: '0.9rem' }}>
              {g.nombre > 1 && <b style={{ color: 'var(--btn)' }}>{g.nombre}x </b>}{nom(g)}
            </span>
          </button>
        ))
        : <small style={{ color: 'var(--texte-secondaire)' }}>Ton inventaire est vide. Les objets gagnés, comme le Parchemin du Destin, apparaîtront ici.</small>}
      {ouvert && (
        <Feuille titre={nom(ouvert)} onFermer={() => setOuvert(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconeRecompense r={ouvert} taille={96} carre />
            <p style={{ margin: 0, minWidth: 0 }}>{RECOMPENSES[ouvert.genre]?.description || 'Objet à garder dans ton inventaire.'}</p>
          </div>
          <small style={{ color: 'var(--texte-secondaire)', fontWeight: 600 }}>
            Tu en possèdes {ouvert.nombre}.
          </small>
        </Feuille>
      )}
    </section>
  );
}
