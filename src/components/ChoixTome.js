'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';

// Choix du tome ou du livre d'un coloriage : liste déroulante (téléphone et ordinateur) avec recherche,
// séparée entre coloriage mystère, Cozy colo et les autres, et ajout d'un nouveau tome ou livre.
// bibliotheque : [{ nom, type, total }] (type : mystere | cozy | autre | null pour un tome perso)
export default function ChoixTome({ valeur, bibliotheque, onChange }) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [nouveau, setNouveau] = useState(null); // nom en cours d'ajout
  const [ajoutes, setAjoutes] = useState([]);
  const zone = useRef(null);

  // Fermer en touchant à côté
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e) => { if (zone.current && !zone.current.contains(e.target)) setOuvert(false); };
    document.addEventListener('pointerdown', fermer);
    return () => document.removeEventListener('pointerdown', fermer);
  }, [ouvert]);

  const groupes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const tous = [...bibliotheque, ...ajoutes.map((nom) => ({ nom, type: null }))]
      .filter((t) => !q || t.nom.toLowerCase().includes(q));
    return [
      ['Coloriage mystère', tous.filter((t) => t.type === 'mystere')],
      ['Cozy colo', tous.filter((t) => t.type === 'cozy')],
      ['Autres tomes et livres', tous.filter((t) => t.type !== 'mystere' && t.type !== 'cozy')],
    ].filter(([, l]) => l.length);
  }, [bibliotheque, ajoutes, recherche]);

  function choisir(nom) { onChange(nom); setOuvert(false); setRecherche(''); }
  function ajouter() {
    const nom = (nouveau || '').trim();
    if (!nom) return;
    if (!bibliotheque.some((t) => t.nom.toLowerCase() === nom.toLowerCase())) setAjoutes((l) => [...l, nom]);
    setNouveau(null);
    choisir(nom);
  }

  const ligne = (actif) => ({
    all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    minHeight: '44px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.92rem',
    background: actif ? 'var(--accent-doux)' : 'transparent', fontWeight: actif ? 700 : 400, overflowWrap: 'anywhere',
  });

  return (
    <div ref={zone} style={{ position: 'relative', minWidth: 0 }}>
      <button type="button" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} aria-haspopup="listbox"
        style={{
          all: 'unset', boxSizing: 'border-box', width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 10px', border: '1px solid var(--bordure)', borderRadius: 'var(--rayon-s)', background: 'var(--blanc)', cursor: 'pointer',
          margin: 'var(--espace-1) 0 var(--espace-2)',
        }}>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: valeur ? 'inherit' : 'var(--texte-secondaire)' }}>
          {valeur || 'Choisir un tome ou un livre'}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>

      {ouvert && (
        <div role="listbox" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60, minWidth: '240px',
          background: 'var(--fond-carte)', border: '1px solid var(--bordure)', borderRadius: 'var(--rayon-m)',
          boxShadow: '0 8px 24px rgb(39 49 54 / 0.18)', maxHeight: '60vh', overflowY: 'auto',
        }}>
          <div style={{ position: 'sticky', top: 0, background: 'var(--fond-carte)', padding: '8px', borderBottom: '1px solid var(--bordure-carte)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />
            <input autoFocus value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un tome ou un livre"
              style={{ margin: 0, flex: 1, minWidth: 0 }} />
          </div>

          {groupes.map(([titre, liste]) => (
            <div key={titre}>
              <small style={{ display: 'block', padding: '8px 12px 2px', fontWeight: 700, color: 'var(--texte-secondaire)', textTransform: 'uppercase', fontSize: '0.72rem' }}>{titre}</small>
              {liste.map((t) => (
                <button key={t.nom} type="button" role="option" aria-selected={t.nom === valeur} onClick={() => choisir(t.nom)} style={ligne(t.nom === valeur)}>
                  <span style={{ flex: 1, minWidth: 0 }}>{t.nom}</span>
                  {t.total ? <small style={{ color: 'var(--texte-secondaire)', flex: '0 0 auto' }}>{t.total} p.</small> : null}
                  {t.nom === valeur && <Check size={16} aria-hidden="true" />}
                </button>
              ))}
            </div>
          ))}
          {!groupes.length && <small style={{ display: 'block', padding: '10px 12px', color: 'var(--texte-secondaire)' }}>Aucun tome ni livre trouvé.</small>}

          {/* Ajouter un tome ou un livre qui n'est pas dans la liste */}
          <div style={{ borderTop: '1px solid var(--bordure-carte)', padding: '8px' }}>
            {nouveau === null ? (
              <button type="button" onClick={() => setNouveau(recherche)} style={{ ...ligne(false), fontWeight: 700, color: 'var(--btn-secondaire-texte)' }}>
                <Plus size={16} aria-hidden="true" /> Ajouter un tome ou un livre
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input autoFocus value={nouveau} onChange={(e) => setNouveau(e.target.value)} placeholder="Nom du tome ou du livre" aria-label="Nom du nouveau tome ou livre"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouter(); } }} style={{ margin: 0, flex: 1, minWidth: 0 }} />
                <button type="button" className="btn" onClick={ajouter} disabled={!nouveau.trim()} style={{ minWidth: '44px' }}>OK</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
