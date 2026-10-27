'use client';
import { useEffect, useState } from 'react';
import { Heart, Share2, X, BookOpen, Pencil } from 'lucide-react';

export default function ListeSouhaits({ id, moi, titre }) {
  const [liste, setListe] = useState(null);
  const [message, setMessage] = useState('');

  const charger = () => fetch(`/api/souhaits${id ? `?id=${id}` : ''}`).then((r) => (r.ok ? r.json() : { tomes: [], coffrets: [] }))
    .then(setListe).catch(() => setListe({ tomes: [], coffrets: [] }));
  useEffect(() => { charger(); }, [id]);

  async function retirer(corps) {
    await fetch('/api/souhaits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...corps, action: 'REMOVE' }) }).catch(() => {});
    charger();
  }

  async function partager() {
    const lien = `${window.location.origin}/membre/${id}#souhaits`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Ma liste de souhaits Kromadex', url: lien }); return; }
      await navigator.clipboard.writeText(lien);
      setMessage('Lien copié.');
    } catch { setMessage(lien); }
  }

  if (!liste) return <p style={{ margin: 0 }}>Chargement…</p>;
  const vide = !liste.tomes.length && !liste.coffrets.length;
  if (vide && !moi) return null;

  const petitX = (label, corps) => moi && (
    <button type="button" className="btn alt" aria-label={label} onClick={() => retirer(corps)}
      style={{ minWidth: '44px', minHeight: '44px', padding: 0, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <X size={18} aria-hidden="true" />
    </button>
  );

  return (
    <section id="souhaits" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--espace-3)' }}>
      {titre && <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={18} aria-hidden="true" /> {titre}</h3>}
      {moi && (
        <button type="button" className="btn btn-corail" onClick={partager} disabled={vide}
          style={{ minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Share2 size={18} aria-hidden="true" /> Partager ma liste
        </button>
      )}
      {message && <small style={{ overflowWrap: 'anywhere' }}>{message}</small>}
      {vide && (
        <p style={{ margin: 0, color: 'var(--texte-secondaire)' }}>
          Ta liste est vide. Touche le cœur à côté d’un tome, d’un livre ou d’un coffret de crayons pour l’ajouter.
        </p>
      )}

      {liste.tomes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <b style={{ fontSize: '0.9rem', color: 'var(--texte-secondaire)', display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={16} aria-hidden="true" /> Tomes et livres</b>
          {liste.tomes.map((t) => (
            <div key={t.id} className="deroulant-choix" style={{ cursor: 'default' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{ width: '40px', flex: '0 0 auto', aspectRatio: '3 / 4', borderRadius: '6px', overflow: 'hidden', background: 'var(--carte)' }}>
                  {t.couverture && <img src={t.couverture} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                </span>
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{t.nom}</b>
                  <small style={{ color: 'var(--texte-secondaire)' }}>{[t.collection, t.nb_pages ? `${t.nb_pages} pages` : ''].filter(Boolean).join(' · ')}</small>
                  {t.url && <a href={t.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.8rem' }}>Où l’acheter</a>}
                </span>
              </span>
              {petitX(`Retirer ${t.nom}`, { tomeId: t.id })}
            </div>
          ))}
        </div>
      )}

      {liste.coffrets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <b style={{ fontSize: '0.9rem', color: 'var(--texte-secondaire)', display: 'flex', alignItems: 'center', gap: '6px' }}><Pencil size={16} aria-hidden="true" /> Coffrets de crayons</b>
          {liste.coffrets.map((c) => (
            <div key={c.id} className="deroulant-choix" style={{ cursor: 'default' }}>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{[c.marque, c.sorte].filter(Boolean).join(' ')} - {c.gamme}</b>
                {c.nb_couleurs > 0 && <small style={{ color: 'var(--texte-secondaire)' }}>{c.nb_couleurs} couleurs</small>}
              </span>
              {petitX(`Retirer ${c.gamme}`, { brandId: c.id })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
