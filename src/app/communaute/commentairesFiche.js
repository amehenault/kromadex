'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, Trash2, CornerDownRight, X } from 'lucide-react';
import { Avatar, nomAuteur, poster } from './outils';

// Commentaires d'un coloriage publié, avec un niveau de réponses
export default function CommentairesFiche({ pageId }) {
  const [liste, setListe] = useState(null);
  const [texte, setTexte] = useState('');
  const [reponseA, setReponseA] = useState(null); // commentaire auquel on répond
  const [erreur, setErreur] = useState('');

  async function charger() {
    const r = await fetch(`/api/communaute/commentaires?page=${pageId}`);
    if (r.ok) setListe((await r.json()).commentaires || []);
  }
  useEffect(() => { charger(); }, [pageId]);

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    const res = await fetch('/api/communaute/commentaires', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId, texte, parentId: reponseA?.id }),
    });
    if (res.ok) { setTexte(''); setReponseA(null); charger(); }
    else setErreur((await res.json().catch(() => ({}))).error || 'Erreur');
  }

  async function retirer(c) {
    if (!confirm('Retirer ce commentaire ?')) return;
    await poster('/api/communaute/commentaires', { id: c.id }, 'DELETE');
    charger();
  }

  const principaux = (liste || []).filter((c) => !c.parent_id);
  const reponses = (id) => (liste || []).filter((c) => c.parent_id === id);

  const bulle = (c, reponse) => (
    <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginLeft: reponse ? '28px' : 0 }}>
      <Link href={`/membre/${c.user_id}`} aria-label={`Profil de ${nomAuteur(c)}`}><Avatar x={c} taille={reponse ? 24 : 28} /></Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: 'var(--carte)', borderRadius: 'var(--rayon-m)', padding: '6px 10px' }}>
          <Link href={`/membre/${c.user_id}`} style={{ fontWeight: 700, fontSize: '0.85rem', color: 'inherit' }}>{nomAuteur(c)}</Link>
          <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.texte}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '2px' }}>
          <button type="button" onClick={() => setReponseA(c)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)', fontSize: '0.8rem', fontWeight: 700, minHeight: '44px', padding: 0 }}>
            Répondre
          </button>
          {c.peut_retirer && (
            <button type="button" onClick={() => retirer(c)} aria-label="Retirer le commentaire"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--texte-secondaire)', minHeight: '44px', padding: 0, display: 'inline-flex', alignItems: 'center' }}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="carte" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <b>Commentaires{liste ? ` (${liste.length})` : ''}</b>
      {liste === null && <small style={{ color: 'var(--texte-secondaire)' }}>Chargement…</small>}
      {liste && !liste.length && <small style={{ color: 'var(--texte-secondaire)' }}>Sois la première personne à laisser un mot d'encouragement.</small>}
      {principaux.map((c) => (
        <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {bulle(c, false)}
          {reponses(c.id).map((r) => bulle(r, true))}
        </div>
      ))}
      <form onSubmit={envoyer} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {reponseA && (
          <small style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--texte-secondaire)' }}>
            <CornerDownRight size={14} aria-hidden="true" /> Réponse à {nomAuteur(reponseA)}
            <button type="button" onClick={() => setReponseA(null)} aria-label="Annuler la réponse"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'inline-flex', minHeight: '44px', alignItems: 'center' }}>
              <X size={14} aria-hidden="true" />
            </button>
          </small>
        )}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1000}
            placeholder={reponseA ? 'Écrire une réponse' : 'Écrire un commentaire'} style={{ flex: 1, minWidth: 0 }} />
          <button type="submit" className="btn" disabled={!texte.trim()} aria-label="Envoyer"
            style={{ minWidth: '44px', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} aria-hidden="true" />
          </button>
        </div>
        {erreur && <small style={{ color: 'var(--danger)' }}>{erreur}</small>}
      </form>
    </div>
  );
}
