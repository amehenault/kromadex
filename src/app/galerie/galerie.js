'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Images } from 'lucide-react';
import { pagesDuNumero } from '@/lib/doublePage';
import { imagePage, Avatar } from '@/app/communaute/outils';
import FicheDetail from '@/app/communaute/ficheDetail';
import Pseudo from '@/components/Pseudo';

const pagesDe = (no) => { const n = pagesDuNumero(no); return n.length ? n.map(String) : [String(no || '').trim()].filter(Boolean); };

export default function Galerie({ tome, couverture, type, total, pageInitiale }) {
  const router = useRouter();
  const [fiches, setFiches] = useState(null);
  const [page, setPage] = useState(pageInitiale || '');
  const [ouverte, setOuverte] = useState(null);

  useEffect(() => {
    fetch(`/api/communaute?vue=tome&tome=${encodeURIComponent(tome)}`).then((r) => (r.ok ? r.json() : { fiches: [] }))
      .then((d) => setFiches(d.fiches || [])).catch(() => setFiches([]));
  }, [tome]);

  const parPage = useMemo(() => {
    const m = new Map();
    for (const f of fiches || []) for (const n of pagesDe(f.page_no)) m.set(n, (m.get(n) || 0) + 1);
    return [...m.entries()].sort((a, b) => (parseInt(a[0], 10) || 1e9) - (parseInt(b[0], 10) || 1e9));
  }, [fiches]);
  const visibles = (fiches || []).filter((f) => !page || pagesDe(f.page_no).includes(page));
  const mot = type === 'cozy' ? 'livre' : 'tome';
  const puce = (actif) => ({
    position: 'relative', minHeight: '44px', minWidth: 0, borderRadius: 'var(--rayon-m)', fontWeight: 800, cursor: 'pointer',
    border: actif ? '2px solid var(--btn)' : '1px solid var(--bordure-carte)', background: actif ? 'var(--btn)' : 'var(--fond-carte)',
    color: actif ? '#ffffff' : 'var(--texte-principal)',
  });

  return (
    <div style={{ maxWidth: 'var(--largeur-max)', margin: '0 auto', padding: 'var(--espace-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--espace-3)' }}>
        <button type="button" className="btn alt" aria-label="Retour" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.15rem', minWidth: 0, overflowWrap: 'anywhere' }}>Coloriages de la communauté</h2>
      </div>

      <div className="carte" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: 'var(--espace-3)' }}>
        <span style={{ width: '64px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {couverture ? <img src={couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={24} aria-hidden="true" />}
        </span>
        <span style={{ minWidth: 0 }}>
          <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{tome}</b>
          <small style={{ color: 'var(--texte-secondaire)' }}>
            {fiches === null ? 'Chargement…' : `${fiches.length} coloriage${fiches.length > 1 ? 's' : ''} partagé${fiches.length > 1 ? 's' : ''}${total ? ` · ${total} pages dans ce ${mot}` : ''}`}
          </small>
        </span>
      </div>

      {fiches && fiches.length > 0 && (
        <>
          <small style={{ display: 'block', fontWeight: 700, marginBottom: '6px' }}>Touche un numéro de page pour voir tous ses coloriages</small>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '6px', marginBottom: 'var(--espace-3)' }}>
            <button type="button" onClick={() => setPage('')} aria-pressed={!page} style={{ ...puce(!page), gridColumn: 'span 2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Images size={16} aria-hidden="true" /> Toutes
            </button>
            {parPage.map(([n, nb]) => (
              <button key={n} type="button" onClick={() => setPage(n)} aria-pressed={page === n} aria-label={`Page ${n}, ${nb} coloriage${nb > 1 ? 's' : ''}`} style={puce(page === n)}>
                {n}
                {nb > 1 && <small style={{ position: 'absolute', top: 1, right: 4, fontSize: '0.6rem', fontWeight: 700 }}>{nb}</small>}
              </button>
            ))}
          </div>
        </>
      )}

      {page && <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Page {page} · {visibles.length} coloriage{visibles.length > 1 ? 's' : ''}</h3>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        {visibles.map((f) => (
          <button key={f.id} type="button" onClick={() => setOuverte(f.id)}
            style={{ all: 'unset', cursor: 'pointer', minWidth: 0, background: 'var(--fond-carte)', border: '1px solid var(--bordure-carte)', borderRadius: 'var(--rayon-m)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <span style={{ position: 'relative', display: 'block', aspectRatio: '1 / 1', background: 'var(--carte)' }}>
              <img src={imagePage(f)} alt={f.title || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {f.page_no && <small style={{ position: 'absolute', left: 4, bottom: 4, background: 'rgba(255,255,255,0.88)', color: '#1d1d1d', borderRadius: 'var(--rayon-s)', padding: '0 5px', fontWeight: 700 }}>p. {f.page_no}</small>}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', minWidth: 0 }}>
              <Avatar x={f} taille={20} />
              <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Pseudo x={f} /></small>
            </span>
          </button>
        ))}
      </div>
      {fiches && !visibles.length && (
        <p style={{ color: 'var(--texte-secondaire)' }}>
          {page ? `Aucun coloriage partagé pour la page ${page} pour l’instant.` : `Aucun coloriage partagé pour ce ${mot} pour l’instant.`}
        </p>
      )}
      {ouverte && <FicheDetail id={ouverte} onFermer={() => setOuverte(null)} onLike={() => {}} />}
    </div>
  );
}
