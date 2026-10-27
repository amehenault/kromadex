'use client';
import { useMemo, useState } from 'react';
import { ArrowLeft, Search, ChevronRight, Check } from 'lucide-react';
import Feuille from './Feuille';
import { CATEGORIES_THEMES, themesDe, couleursDuTheme } from '@/lib/themesPalettes';

export default function ChoixTheme({ categorie: fixe, valeur, aucun, onChoisir, onFermer }) {
  const [categorie, setCategorie] = useState(fixe || null);
  const [recherche, setRecherche] = useState('');
  const q = recherche.trim().toLowerCase();
  const apercus = useMemo(() => Object.fromEntries(CATEGORIES_THEMES.flatMap((c) => themesDe(c.cle).map((t) => [`${c.cle}:${t.cle}`, couleursDuTheme(t, 5)]))), []);
  const themes = themesDe(categorie).filter((t) => !q || t.nom.toLowerCase().includes(q));
  const nomCategorie = CATEGORIES_THEMES.find((c) => c.cle === categorie)?.nom;

  const ligne = { all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px', padding: '6px 4px', borderBottom: '1px solid var(--bordure-carte)' };

  return (
    <Feuille haute titre={categorie ? nomCategorie : 'Ambiance ou fête'} onFermer={onFermer}>
      {!categorie && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {aucun && (
            <button type="button" onClick={() => onChoisir(null)} style={ligne}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{aucun}</span>
              {!valeur?.cle && <Check size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />}
            </button>
          )}
          {CATEGORIES_THEMES.map((c) => (
            <button key={c.cle} type="button" onClick={() => { setCategorie(c.cle); setRecherche(''); }} style={ligne}>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{c.nom}</span>
              <small style={{ color: 'var(--texte-secondaire)', flex: '0 0 auto' }}>{themesDe(c.cle).length} choix</small>
              <ChevronRight size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />
            </button>
          ))}
        </div>
      )}

      {categorie && (
        <>
          {!fixe && (
            <button type="button" className="btn alt" onClick={() => { setCategorie(null); setRecherche(''); }}
              style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
              <ArrowLeft size={16} aria-hidden="true" /> Changer de catégorie
            </button>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Search size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ margin: 0, flex: 1, minWidth: 0 }}
              placeholder={categorie === 'fete' ? 'Rechercher une fête' : 'Rechercher une ambiance'}
              aria-label={categorie === 'fete' ? 'Rechercher une fête' : 'Rechercher une ambiance'} />
          </label>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {fixe && aucun && !q && (
              <button type="button" onClick={() => onChoisir(null)} style={ligne}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{aucun}</span>
                {!valeur?.cle && <Check size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />}
              </button>
            )}
            {themes.map((t) => {
              const actif = valeur?.categorie === categorie && valeur?.cle === t.cle;
              return (
                <button key={t.cle} type="button" onClick={() => onChoisir({ categorie, cle: t.cle })} aria-pressed={actif} style={ligne}>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>{t.nom}</span>
                  <span aria-hidden="true" style={{ display: 'flex', flex: '0 0 auto', width: '90px', height: '20px', borderRadius: 'var(--rayon-s)', overflow: 'hidden', border: '1px solid var(--bordure-carte)' }}>
                    {apercus[`${categorie}:${t.cle}`].map((c, i) => <span key={i} style={{ flex: 1, background: c }} />)}
                  </span>
                  {actif ? <Check size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} /> : <ChevronRight size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />}
                </button>
              );
            })}
            {!themes.length && <small style={{ color: 'var(--texte-secondaire)', padding: '8px 0' }}>Aucun résultat.</small>}
          </div>
        </>
      )}
    </Feuille>
  );
}
