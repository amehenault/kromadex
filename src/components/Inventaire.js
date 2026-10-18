'use client';
import { useState } from 'react';
import { Backpack, Info } from 'lucide-react';
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
      {!groupes.length && <small style={{ color: 'var(--texte-secondaire)' }}>Ton inventaire est vide. Les objets gagnés, comme le Parchemin du Destin, apparaîtront ici.</small>}

      {/* Un seul objet : son icône et son nom */}
      {groupes.length === 1 && groupes.map((g) => (
        <button key={`${g.genre}|${g.detail}`} type="button" onClick={() => setOuvert(g)}
          style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '72px', minWidth: 0 }}>
          <IconeRecompense r={g} taille={64} carre />
          <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontWeight: 600, fontSize: '0.9rem' }}>
            {g.nombre > 1 && <b style={{ color: 'var(--btn)' }}>{g.nombre}x </b>}{nom(g)}
          </span>
        </button>
      ))}

      {/* Plusieurs objets différents : 3 icônes de large, sans les noms (le nom et la description s'ouvrent au toucher) */}
      {groupes.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px 8px' }}>
          {groupes.map((g) => (
            <button key={`${g.genre}|${g.detail}`} type="button" onClick={() => setOuvert(g)}
              aria-label={`${g.nombre > 1 ? `${g.nombre}x ` : ''}${nom(g)}`}
              style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px', minWidth: 0 }}>
              <IconeRecompense r={g} taille={72} carre />
              {g.nombre > 1 && (
                <b aria-hidden="true" style={{
                  position: 'absolute', right: '6px', bottom: '2px', padding: '1px 7px', borderRadius: '999px',
                  background: 'var(--couleur-secondaire)', color: 'var(--noir)', fontSize: '0.75rem',
                }}>{g.nombre}x</b>
              )}
            </button>
          ))}
        </div>
      )}
      {ouvert && (
        <Feuille titre={nom(ouvert)} onFermer={() => setOuvert(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconeRecompense r={ouvert} taille={96} carre />
            <p style={{ margin: 0, minWidth: 0 }}>{RECOMPENSES[ouvert.genre]?.description || 'Objet à garder dans ton inventaire.'}</p>
          </div>
          <small style={{ color: 'var(--texte-secondaire)', fontWeight: 600 }}>
            Tu en possèdes {ouvert.nombre}.
          </small>
          {/* Mémo : l'objet ne s'utilise jamais tout seul */}
          <div role="note" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)' }}>
            <Info size={18} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)', marginTop: '1px' }} />
            <small style={{ fontWeight: 600 }}>
              C’est toi qui décides à quel moment utiliser cet objet : il reste dans ton inventaire jusqu’à ce que tu choisisses de t’en servir.
            </small>
          </div>
        </Feuille>
      )}
    </section>
  );
}
