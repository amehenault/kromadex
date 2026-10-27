'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Feuille from './Feuille';
import { AVERTISSEMENT_SOUMISSION } from '@/lib/activites';
import TexteErreur from '@/components/TexteErreur';

const image = (f) => `/api/pages/${f.id}/image?s=${f.img_size || 0}`;

export default function ChoixColoriage({ titre = 'Choisis ton coloriage', type, tomes, publiees, nonPubliees, avertissement = true, exclure = [], aide, onChoisir, onFermer, erreur }) {
  const [fiches, setFiches] = useState(null);
  const [tout, setTout] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams();
    if (type && type !== 'tous') p.set('type', type);
    if (tomes) p.set('tomes', '1');
    if (publiees) p.set('publiees', '1');
    if (nonPubliees) p.set('nonpubliees', '1');
    fetch(`/api/mes-coloriages?${p}`).then((r) => r.json()).then((d) => setFiches(d.fiches || [])).catch(() => setFiches([]));
  }, [type, tomes, publiees, nonPubliees]);

  const visibles = (fiches || []).filter((f) => !exclure.includes(f.id));
  const parTome = tomes && !tout
    ? Object.entries(visibles.reduce((g, f) => ((g[f.tome] ||= []).push(f), g), {})).sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))
    : [['', visibles]];

  const grille = (liste) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
      {liste.map((f) => (
        <button key={f.id} type="button" onClick={() => onChoisir(f)} style={{ all: 'unset', cursor: 'pointer', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ display: 'block', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
            <img src={image(f)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </span>
          <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.page_no ? `p. ${f.page_no} · ` : ''}{f.title || 'Sans titre'}</small>
        </button>
      ))}
    </div>
  );

  return (
    <Feuille titre={titre} onFermer={onFermer}>
      {avertissement && (
        <p style={{ margin: 0, display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
          <AlertTriangle size={18} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: '1px' }} />
          <span>{AVERTISSEMENT_SOUMISSION}</span>
        </p>
      )}
      {aide && <small style={{ color: 'var(--texte-secondaire)' }}>{aide}</small>}
      {tomes && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button type="button" className={!tout ? 'btn' : 'btn alt'} style={{ minHeight: '44px' }} onClick={() => setTout(false)}>Par tome / livre</button>
          <button type="button" className={tout ? 'btn' : 'btn alt'} style={{ minHeight: '44px' }} onClick={() => setTout(true)}>Tout mélangé</button>
        </div>
      )}
      {!fiches && <p style={{ margin: 0 }}>Chargement…</p>}
      {fiches && !visibles.length && <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>Aucun coloriage ne convient pour l’instant.</p>}
      {parTome.map(([tome, liste]) => (
        <div key={tome || 'tout'} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tome && <b style={{ fontSize: '0.9rem' }}>{tome}</b>}
          {grille(liste)}
        </div>
      ))}
      {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
    </Feuille>
  );
}
