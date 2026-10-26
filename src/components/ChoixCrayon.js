'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import Feuille from './Feuille';
import { libelleMarque } from '@/lib/libelleCrayon';

// Crayons de la personne, rechargés à chaque ouverture (un crayon ajouté juste avant apparaît) : ceux de ses coffrets, puis ses crayons à l'unité
// (entrés à la main dans Collection de crayons), regroupés dans un coffret « Crayons à l'unité » placé en premier
const UNITE = 'unite';
const lire = (url) => fetch(url).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
const charger = () => (Promise.all([lire('/api/palettes?vue=crayons'), lire('/api/crayons-unite')]).then(([d, u]) => {
  const unite = (u.crayons || []).map((c) => ({ id: `u${c.id}`, code: c.code, nom: '', hex: c.hex || '', pack: UNITE, marque: c.marque }));
  return {
    crayons: [...unite, ...(d.crayons || [])],
    packs: [...(unite.length ? [{ id: UNITE, marque: 'Crayons à l’unité' }] : []), ...(d.packs || [])],
  };
}));

const nomPack = (p) => [p.marque, p.sorte, p.gamme].filter(Boolean).join(' ');

// Choisir un code couleur dans ses coffrets : d'abord le coffret (avec recherche), puis le crayon,
// comme dans Collection de crayons (cercle de couleur, numéro et marque dessous), avec recherche par numéro.
// onChoisir({ code, marque, hex })
// rappel : ce qu'on est en train de remplir (symbole, lettre ou numéro de la ligne), toujours visible en haut
export default function ChoixCrayon({ onChoisir, onFermer, onManuel, rappel }) {
  const [donnees, setDonnees] = useState(null);
  const [pack, setPack] = useState(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => { charger().then(setDonnees); }, []);

  const q = recherche.trim().toLowerCase();
  // Marque affichée sous le crayon et écrite dans le code : celle du coffret avec sa sorte si ce n'est ni du brush ni de l'alcool
  // (lib/libelleCrayon.js), ou celle entrée à la main pour un crayon à l'unité
  const marqueDe = (c) => (pack?.id === UNITE ? c.marque : (pack?.marque ? libelleMarque(pack.marque, pack.sorte) : nomPack(pack || {})));
  const packs = useMemo(() => (donnees?.packs || []).filter((p) => !q || nomPack(p).toLowerCase().includes(q)), [donnees, q]);
  const crayons = useMemo(() => (donnees?.crayons || [])
    .filter((c) => c.pack === pack?.id)
    .filter((c) => !q || `${c.code || ''} ${c.nom || ''} ${pack?.id === UNITE ? c.marque : ''}`.toLowerCase().includes(q))
    .sort((a, b) => String(a.code).localeCompare(String(b.code), 'fr', { numeric: true })), [donnees, pack, q]);

  const barre = (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
      <Search size={16} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />
      <input value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ margin: 0, flex: 1, minWidth: 0 }}
        placeholder={pack ? 'Numéro de la couleur' : 'Rechercher un coffret'}
        aria-label={pack ? 'Rechercher un numéro de couleur' : 'Rechercher un coffret'} />
    </label>
  );

  return (
    <Feuille haute titre={pack ? nomPack(pack) : 'Mes packs de couleurs'} onFermer={onFermer}>
      {rappel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--rayon-m)', background: 'var(--accent-doux)', fontWeight: 700 }}>
          {rappel}
        </div>
      )}
      {!donnees &&<small style={{ color: 'var(--texte-secondaire)' }}>Chargement…</small>}

      {donnees && !donnees.packs.length && (
        <>
          <small style={{ color: 'var(--texte-secondaire)' }}>
            Tu n’as encore aucun coffret ni crayon à l’unité. Ajoute tes crayons dans tes <Link href="/profil/collection">Collections (onglet Crayons)</Link>, ou écris le code toi-même.
          </small>
          <button type="button" className="btn" onClick={onManuel} style={{ minHeight: '48px', fontWeight: 700 }}>Écrire manuellement</button>
        </>
      )}

      {/* Étape 1 : choisir le coffret */}
      {donnees && donnees.packs.length > 0 && !pack && (
        <>
          {barre}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {packs.map((p) => (
              <button key={p.id} type="button" onClick={() => { setPack(p); setRecherche(''); }}
                style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px', padding: '6px 4px', borderBottom: '1px solid var(--bordure-carte)' }}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>{nomPack(p)}</span>
                <small style={{ color: 'var(--texte-secondaire)', flex: '0 0 auto' }}>{donnees.crayons.filter((c) => c.pack === p.id).length} couleurs</small>
                <ChevronRight size={18} aria-hidden="true" style={{ flex: '0 0 auto' }} />
              </button>
            ))}
            {!packs.length && <small style={{ color: 'var(--texte-secondaire)', padding: '8px 0' }}>Aucun coffret trouvé.</small>}
          </div>
        </>
      )}

      {/* Étape 2 : choisir le crayon */}
      {pack && (
        <>
          <button type="button" className="btn alt" onClick={() => { setPack(null); setRecherche(''); }}
            style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
            <ArrowLeft size={16} aria-hidden="true" /> Changer de coffret
          </button>
          {barre}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: '8px' }}>
            {crayons.map((c) => (
              <button key={c.id} type="button" onClick={() => onChoisir({ code: c.code || c.nom || '', marque: marqueDe(c), hex: c.hex })}
                aria-label={`${c.code || ''} ${c.nom || ''} ${marqueDe(c)}`.trim()}
                style={{
                  all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '4px', padding: '8px 4px', minHeight: '96px', minWidth: 0, textAlign: 'center',
                  background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)',
                }}>
                <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: '50%', background: c.hex || '#808080', border: '1px solid rgba(0,0,0,0.15)', boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }} />
                <b style={{ fontSize: '0.9rem', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{c.code || c.nom}</b>
                <small style={{ fontSize: '0.7rem', color: 'var(--texte-secondaire)', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{marqueDe(c)}</small>
              </button>
            ))}
          </div>
          {!crayons.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucune couleur trouvée avec ce numéro.</small>}
        </>
      )}
    </Feuille>
  );
}
