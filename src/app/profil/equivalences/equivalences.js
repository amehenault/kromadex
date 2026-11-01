'use client';
import { useEffect, useState } from 'react';
import { Search, ArrowLeftRight } from 'lucide-react';
import TexteErreur from '@/components/TexteErreur';

const proximite = (d) => (d < 6 ? 'presque identique' : d < 12 ? 'très proche' : 'proche');
const pastille = (hex, taille = 28) => (
  <span aria-hidden="true" style={{ flex: '0 0 auto', width: taille, height: taille, borderRadius: '50%', background: hex, border: '1px solid rgba(0,0,0,0.15)' }} />
);

export default function Equivalences() {
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState([]);
  const [choisi, setChoisi] = useState(null);
  const [miens, setMiens] = useState(false);
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const q = recherche.trim();
    if (q.length < 2) { setResultats([]); return; }
    const minuterie = setTimeout(async () => {
      const r = await fetch(`/api/equivalences?q=${encodeURIComponent(q)}`).catch(() => null);
      if (r?.ok) setResultats((await r.json()).crayons || []);
    }, 250);
    return () => clearTimeout(minuterie);
  }, [recherche]);

  useEffect(() => {
    if (!choisi) return;
    setDonnees(null); setErreur('');
    fetch(`/api/equivalences?color=${choisi.id}${miens ? '&miens=1' : ''}`)
      .then(async (r) => { const d = await r.json(); if (r.ok) setDonnees(d); else setErreur(d.error || 'Erreur'); })
      .catch(() => setErreur('Erreur, réessaie.'));
  }, [choisi, miens]);

  const ligne = { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '48px', minWidth: 0 };
  return (
    <>
      <p style={{ marginTop: 0, color: 'var(--texte-secondaire)', fontSize: '0.9rem' }}>
        Trouve le crayon le plus proche dans les autres marques, quand tu changes de marque ou qu’il te manque une couleur.
        Seuls les crayons du même type sont proposés : l’acrylique, le gel acrylique et le gel se remplacent entre eux, mais jamais avec l’alcool.
      </p>
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="ex. Ohuhu R7, Posca rose, Lilas…" aria-label="Chercher un crayon"
          style={{ width: '100%', paddingLeft: '36px' }} />
      </div>

      {resultats.length > 0 && (
        <div className="carte" style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--espace-3)', maxHeight: '45dvh', overflowY: 'auto' }}>
          {resultats.map((c) => (
            <button key={c.id} type="button" onClick={() => { setChoisi(c); setResultats([]); setRecherche(''); }}
              style={{ all: 'unset', cursor: 'pointer', ...ligne, borderBottom: '1px solid var(--bordure-carte)' }}>
              {pastille(c.hex, 24)}
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{c.code}{c.nom ? ` · ${c.nom}` : ''}</b>
                <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{c.pack}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      {choisi && (
        <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={ligne}>
            {pastille(choisi.hex, 40)}
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{choisi.code}{choisi.nom ? ` · ${choisi.nom}` : ''}</b>
              <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{choisi.pack}</small>
            </span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={miens} onChange={(e) => setMiens(e.target.checked)} style={{ width: 22, height: 22 }} />
            Seulement parmi mes coffrets
          </label>
          {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
          {!donnees && !erreur && <p style={{ margin: 0 }}>Recherche des équivalences…</p>}
          {donnees && (
            <>
              <b style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowLeftRight size={18} aria-hidden="true" /> Équivalences ({donnees.famille})</b>
              {!donnees.equivalences.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun crayon assez proche dans les autres marques{miens ? ' de tes coffrets' : ''}.</small>}
              {donnees.equivalences.map((c) => (
                <div key={c.id} style={{ ...ligne, borderTop: '1px solid var(--bordure-carte)', paddingTop: '6px' }}>
                  {pastille(c.hex)}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{c.code}{c.nom ? ` · ${c.nom}` : ''}</b>
                    <small style={{ color: 'var(--texte-secondaire)', overflowWrap: 'anywhere' }}>{c.pack}</small>
                  </span>
                  <small style={{ flex: '0 0 auto', fontWeight: 700 }}>{proximite(c.distance)}</small>
                </div>
              ))}
              <small style={{ color: 'var(--texte-secondaire)' }}>Les couleurs sont comparées à l’écran : le rendu réel peut varier selon le papier.</small>
            </>
          )}
        </div>
      )}
    </>
  );
}
