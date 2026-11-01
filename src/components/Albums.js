'use client';
import { useEffect, useState } from 'react';
import { FolderHeart, Plus, Trash2, Pencil, X, Lock } from 'lucide-react';
import Feuille from './Feuille';
import ChoixColoriage from './ChoixColoriage';
import TexteErreur from './TexteErreur';
import FicheDetail from '@/app/communaute/ficheDetail';

const image = (p) => `/api/pages/${p.id}/image?s=${p.img_size || 0}`;

export default function Albums({ id, moi, titre }) {
  const [albums, setAlbums] = useState(null);
  const [ouvert, setOuvert] = useState(null);
  const [nouveau, setNouveau] = useState(null);
  const [choix, setChoix] = useState(false);
  const [fiche, setFiche] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    fetch(`/api/albums?id=${id}`).then((r) => (r.ok ? r.json() : { albums: [] })).then((d) => setAlbums(d.albums || [])).catch(() => setAlbums([]));
  }, [id]);

  async function appeler(method, corps) {
    setErreur('');
    const r = await fetch('/api/albums', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErreur(d.error || 'Erreur, réessaie.'); return false; }
    setAlbums(d.albums || []);
    return true;
  }

  if (albums === null || (!moi && !albums.length)) return null;
  const album = ouvert ? albums.find((a) => a.id === ouvert) : null;
  const bouton = { minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 };

  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
        <FolderHeart size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> {titre || (moi ? 'Mes albums' : 'Albums')}
      </b>
      {moi && !albums.length && (
        <small style={{ color: 'var(--texte-secondaire)' }}>Regroupe tes coloriages en collections, par exemple « Halloween 2026 » ou « Mes Stitch ». Les autres voient seulement tes coloriages publiés.</small>
      )}
      {albums.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
          {albums.map((a) => (
            <button key={a.id} type="button" onClick={() => setOuvert(a.id)} style={{ all: 'unset', cursor: 'pointer', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', borderRadius: 'var(--rayon-m)', overflow: 'hidden', background: 'var(--carte)', border: '1px solid var(--bordure-carte)' }}>
                {a.pages[0] ? <img src={image(a.pages[0])} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FolderHeart size={26} aria-hidden="true" style={{ color: 'var(--texte-secondaire)' }} />}
              </span>
              <b style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nom}</b>
              <small style={{ color: 'var(--texte-secondaire)', fontSize: '0.75rem' }}>{a.pages.length} coloriage{a.pages.length > 1 ? 's' : ''}</small>
            </button>
          ))}
        </div>
      )}
      {moi && (nouveau === null ? (
        <button type="button" className="btn alt" style={bouton} onClick={() => setNouveau('')}><Plus size={16} aria-hidden="true" /> Créer un album</button>
      ) : (
        <form onSubmit={async (e) => { e.preventDefault(); if (await appeler('POST', { action: 'creer', nom: nouveau })) setNouveau(null); }} style={{ display: 'flex', gap: '6px' }}>
          <input autoFocus value={nouveau} onChange={(e) => setNouveau(e.target.value)} maxLength={60} placeholder="ex. Halloween 2026" aria-label="Nom de l’album" style={{ flex: 1, minWidth: 0, margin: 0 }} />
          <button type="submit" className="btn" disabled={!nouveau.trim()} style={{ minHeight: '44px' }}>Créer</button>
          <button type="button" className="btn alt" aria-label="Annuler" onClick={() => setNouveau(null)} style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} aria-hidden="true" /></button>
        </form>
      ))}
      {erreur && !album && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}

      {album && !choix && (
        <Feuille titre={album.nom} onFermer={() => { setOuvert(null); setErreur(''); }}>
          {!album.pages.length && <small style={{ color: 'var(--texte-secondaire)' }}>Cet album est vide pour l’instant.</small>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
            {album.pages.map((p) => (
              <div key={p.id} style={{ position: 'relative', minWidth: 0 }}>
                <button type="button" onClick={() => p.publiee && setFiche(p.id)} aria-label={p.title || 'Coloriage'}
                  style={{ all: 'unset', cursor: p.publiee ? 'pointer' : 'default', display: 'block', aspectRatio: '1 / 1', width: '100%', borderRadius: 'var(--rayon-s)', overflow: 'hidden', background: 'var(--carte)' }}>
                  <img src={image(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
                {moi && !p.publiee && (
                  <span title="Non publié : visible par toi seulement" style={{ position: 'absolute', left: 4, top: 4, background: 'rgba(255,255,255,0.88)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d1d1d' }}>
                    <Lock size={13} aria-label="Non publié" />
                  </span>
                )}
                {moi && (
                  <button type="button" aria-label="Retirer de l’album" onClick={() => appeler('POST', { action: 'retirer', albumId: album.id, pageId: p.id })}
                    style={{ position: 'absolute', right: 2, top: 2, width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 2 }}>
                    <span style={{ background: 'rgba(255,255,255,0.88)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d1d1d' }}><X size={14} aria-hidden="true" /></span>
                  </button>
                )}
              </div>
            ))}
          </div>
          {moi && (
            <>
              {moi && album.pages.some((p) => !p.publiee) && <small style={{ color: 'var(--texte-secondaire)' }}>Les coloriages avec un cadenas ne sont pas publiés : les autres ne les voient pas.</small>}
              <button type="button" className="btn" style={bouton} onClick={() => setChoix(true)}><Plus size={16} aria-hidden="true" /> Ajouter un coloriage</button>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="btn alt" style={{ ...bouton, flex: 1 }} onClick={() => { const nom = prompt('Nouveau nom de l’album', album.nom); if (nom?.trim()) appeler('POST', { action: 'renommer', albumId: album.id, nom }); }}>
                  <Pencil size={16} aria-hidden="true" /> Renommer
                </button>
                <button type="button" className="btn alt danger" style={{ ...bouton, flex: 1 }} onClick={async () => { if (confirm(`Supprimer l’album « ${album.nom} » ? Tes coloriages ne sont pas supprimés.`) && await appeler('DELETE', { albumId: album.id })) setOuvert(null); }}>
                  <Trash2 size={16} aria-hidden="true" /> Supprimer
                </button>
              </div>
            </>
          )}
          {erreur && <small style={{ color: 'var(--danger)', fontWeight: 600 }}><TexteErreur texte={erreur} /></small>}
        </Feuille>
      )}
      {album && choix && (
        <ChoixColoriage titre={`Ajouter à « ${album.nom} »`} avertissement={false} exclure={album.pages.map((p) => p.id)}
          onChoisir={async (f) => { await appeler('POST', { action: 'ajouter', albumId: album.id, pageId: f.id }); setChoix(false); }}
          onFermer={() => setChoix(false)} />
      )}
      {fiche && <FicheDetail id={fiche} onFermer={() => setFiche(null)} onLike={() => {}} />}
    </section>
  );
}
