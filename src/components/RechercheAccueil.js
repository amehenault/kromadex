'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Tag, X } from 'lucide-react';

// Barre de recherche de l'accueil : tomes et livres par nom ou par mot-clé (ex. « Stitch »)
export default function RechercheAccueil() {
  const [q, setQ] = useState('');
  const [resultats, setResultats] = useState(null);

  useEffect(() => {
    const texte = q.trim();
    if (texte.length < 2) { setResultats(null); return; }
    const minuterie = setTimeout(async () => {
      const r = await fetch(`/api/mots-cles?q=${encodeURIComponent(texte)}`).catch(() => null);
      if (r?.ok) setResultats((await r.json()).resultats || []);
    }, 250);
    return () => clearTimeout(minuterie);
  }, [q]);

  return (
    <div style={{ marginBottom: 'var(--espace-3)' }}>
      <div style={{ position: 'relative' }}>
        <Search size={18} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-secondaire)' }} />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un tome, un livre ou un mot-clé"
          placeholder="Rechercher un tome, un livre ou un mot-clé" style={{ width: '100%', paddingLeft: '40px', paddingRight: q ? '44px' : undefined, margin: 0 }} />
        {q && (
          <button type="button" aria-label="Effacer la recherche" onClick={() => setQ('')}
            style={{ position: 'absolute', right: 0, top: 0, width: '44px', height: '44px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texte-secondaire)' }}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {resultats && (
        <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {!resultats.length && <small style={{ color: 'var(--texte-secondaire)' }}>Aucun tome ni livre trouvé pour « {q.trim()} ».</small>}
          {resultats.map((t) => {
            const pages = [...new Set(t.mots.filter((m) => m.page).map((m) => m.page))];
            const mots = [...new Set(t.mots.map((m) => m.mot))];
            return (
              <Link key={t.id} href={`/profil/tome?nom=${encodeURIComponent(t.nom)}`}
                style={{ display: 'flex', gap: '10px', alignItems: 'center', textDecoration: 'none', color: 'inherit', minHeight: '44px' }}>
                <span style={{ width: '42px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--accent-doux)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.couverture ? <img src={t.couverture} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <BookOpen size={18} aria-hidden="true" />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{t.nom}</b>
                  <small style={{ color: 'var(--texte-secondaire)' }}>
                    {t.type === 'cozy' ? 'Livre' : 'Tome'}{t.collection ? ` · ${t.collection}` : ''}{t.possede ? ' · dans ma collection' : ''}
                  </small>
                  {mots.length > 0 && (
                    <small style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <Tag size={12} aria-hidden="true" /> {mots.join(', ')}
                      {pages.length > 0 && <span style={{ color: 'var(--texte-secondaire)' }}> · page{pages.length > 1 ? 's' : ''} {pages.join(', ')}</span>}
                    </small>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
