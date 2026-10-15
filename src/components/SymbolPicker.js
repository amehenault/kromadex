'use client';
import { useState } from 'react';
import { LETTRES, CHIFFRES, SYMBOLES } from '@/lib/symboles';

// Affiche une lettre, un chiffre ou un symbole (les symboles sont enregistrés sous la forme s:identifiant)
export function Glyph({ v }) {
  if (!v) return <span className="glyphe vide">?</span>;
  if (v.startsWith('s:')) {
    const s = SYMBOLES.find((x) => x.id === v.slice(2));
    // Affiche le texte directement dans un span au lieu du SVG
    return s ? <span className="glyphe symbole" aria-label={s.nom}>{s.d}</span> : null;
  }
  return <span className="glyphe">{v}</span>;
}

const ONGLETS = [['lettres', 'Lettres'], ['chiffres', 'Chiffres'], ['symboles', 'Symboles']];

export default function SymbolPicker({ value, onChange }) {
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState(() => /^\d$/.test(value || '') ? 'chiffres' : (value || '').startsWith('s:') ? 'symboles' : 'lettres');
  const choix = onglet === 'lettres' ? LETTRES.map((x) => [x, x]) : onglet === 'chiffres' ? CHIFFRES.map((x) => [x, x]) : SYMBOLES.map((s) => ['s:' + s.id, s.nom]);
  return (
    <>
      <button type="button" className="symbole-btn" onClick={() => setOuvert(true)} aria-label="Choisir une lettre, un chiffre ou un symbole"><Glyph v={value} /></button>
      {ouvert && (
        <div className="voile" onClick={() => setOuvert(false)}>
          <div className="tiroir" role="dialog" aria-label="Choisir" onClick={(e) => e.stopPropagation()}>
            <div className="onglets">
              {ONGLETS.map(([k, t]) => <button type="button" key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{t}</button>)}
            </div>
            <div className="choix">
              {choix.map(([v, nom]) => (
                <button type="button" key={v} className={v === value ? 'actif' : ''} aria-label={nom} onClick={() => { onChange(v); setOuvert(false); }}><Glyph v={v} /></button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
