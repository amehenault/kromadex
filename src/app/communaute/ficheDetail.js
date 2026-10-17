'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Glyph } from '@/components/SymbolPicker';
import { Avatar, BoutonJaime, nomAuteur, nomType, imagePage, poster } from './outils';
import CommentairesFiche from './commentairesFiche';

// Codes couleurs en lecture seule : sous-catégories, puis symbole + code de chaque couleur
export function CodesLecture({ codes }) {
  const groupes = (Array.isArray(codes) ? codes : []).filter((g) => (g.rows || []).some((r) => r.num || r.label));
  if (!groupes.length) return <small style={{ color: 'var(--texte-secondaire)' }}>Aucun code couleur noté.</small>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {groupes.map((g, i) => (
        <div key={g.id || i}>
          {g.name && <b style={{ display: 'block', marginBottom: '4px' }}>{g.name}</b>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 10px' }}>
            {(g.rows || []).filter((r) => r.num || r.label).map((r, j) => (
              <div key={r.id || j} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ flex: '0 0 auto', minWidth: '26px', textAlign: 'center' }}><Glyph v={r.sym} /></span>
                <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontSize: '0.9rem' }}>
                  {r.label && <small style={{ display: 'block', color: 'var(--texte-secondaire)' }}>{r.label}</small>}
                  {r.num || '?'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Feuille plein écran : grande photo, infos, J'aime et codes couleurs
export default function FicheDetail({ id, onFermer, onLike }) {
  const [fiche, setFiche] = useState(null);

  useEffect(() => {
    fetch(`/api/communaute?vue=fiche&id=${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setFiche(d.fiche));
  }, [id]);

  async function aimer() {
    setFiche((f) => ({ ...f, aime: !f.aime, likes: f.likes + (f.aime ? -1 : 1) }));
    const r = await poster('/api/communaute', { id });
    if (r) { setFiche((f) => ({ ...f, aime: r.aime, likes: r.likes })); onLike?.(id, r); }
  }

  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: '560px', maxHeight: '92dvh', overflowY: 'auto', background: 'var(--fond-page)',
        borderRadius: 'var(--rayon-l) var(--rayon-l) 0 0', padding: 'var(--espace-3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'sticky', top: 0 }}>
          <button type="button" className="btn alt" aria-label="Fermer" onClick={onFermer} style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center', display: 'inline-flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>
        {!fiche ? <p>Chargement…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <img src={imagePage(fiche)} alt="" style={{ width: '100%', borderRadius: 'var(--rayon-m)', background: 'var(--carte)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href={`/membre/${fiche.auteur_id}`} aria-label={`Profil de ${nomAuteur(fiche)}`}><Avatar x={fiche} taille={32} /></Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{fiche.title}</b>
                <small style={{ color: 'var(--texte-secondaire)' }}>
                  <Link href={`/membre/${fiche.auteur_id}`} style={{ color: 'inherit' }}>{nomAuteur(fiche)}</Link> · {nomType(fiche.type_coloriage)}
                </small>
              </div>
              <BoutonJaime aime={fiche.aime} likes={fiche.likes} onClick={aimer} />
            </div>
            {(fiche.tome || fiche.page_no) && (
              <small style={{ fontWeight: 700 }}>{fiche.tome}{fiche.page_no ? ` · page ${fiche.page_no}` : ''}</small>
            )}
            <div className="carte"><b style={{ display: 'block', marginBottom: '8px' }}>Codes couleurs</b><CodesLecture codes={fiche.codes} /></div>
            <CommentairesFiche pageId={fiche.id} />
          </div>
        )}
      </div>
    </div>
  );
}
