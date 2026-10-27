'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import Feuille from './Feuille';

export default function Deroulant({ value, onChange, options, placeholder = 'Choisir', titre, recherche, disabled, ariaLabel, compact, style }) {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState('');
  const choisi = options.find((o) => String(o.valeur) === String(value ?? ''));
  const avecRecherche = recherche ?? options.length > 8;

  const q = texte.trim().toLowerCase();
  const visibles = q ? options.filter((o) => `${o.label} ${o.aide || ''} ${o.groupe || ''}`.toLowerCase().includes(q)) : options;
  const groupes = visibles.reduce((g, o) => {
    const cle = o.groupe || '';
    (g.find((x) => x[0] === cle) || g[g.push([cle, []]) - 1])[1].push(o);
    return g;
  }, []);

  const fermer = () => { setOuvert(false); setTexte(''); };
  const choisir = (o) => { fermer(); if (String(o.valeur) !== String(value ?? '')) onChange(o.valeur); };

  return (
    <>
      <button type="button" className={compact ? 'deroulant compact' : 'deroulant'} disabled={disabled} aria-haspopup="dialog" aria-label={ariaLabel}
        onClick={() => setOuvert(true)} style={style}>
        <span className={choisi ? 'deroulant-valeur' : 'deroulant-valeur vide'}>{choisi ? choisi.label : placeholder}</span>
        <ChevronDown size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />
      </button>
      {ouvert && createPortal(
        <Feuille titre={titre || ariaLabel || placeholder} onFermer={fermer} haute={avecRecherche}>
          {avecRecherche && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '10px', color: 'var(--texte-secondaire)' }} />
              <input type="search" placeholder="Rechercher…" value={texte} onChange={(e) => setTexte(e.target.value)}
                style={{ width: '100%', margin: 0, paddingLeft: '34px' }} />
            </div>
          )}
          {!visibles.length && <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Aucun résultat.</p>}
          {groupes.map(([groupe, liste]) => (
            <div key={groupe || 'tout'} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groupe && <b style={{ fontSize: '0.9rem', color: 'var(--texte-secondaire)' }}>{groupe}</b>}
              {liste.map((o) => {
                const actif = choisi && String(o.valeur) === String(choisi.valeur);
                return (
                  <button key={String(o.valeur)} type="button" className={actif ? 'deroulant-choix actif' : 'deroulant-choix'} aria-pressed={actif} onClick={() => choisir(o)}>
                    <span style={{ minWidth: 0 }}>
                      <b>{o.label}</b>
                      {o.aide && <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>{o.aide}</small>}
                    </span>
                    {actif && <Check size={20} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </Feuille>,
        document.body,
      )}
    </>
  );
}
