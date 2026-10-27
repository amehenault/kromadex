'use client';
import { Heart, User } from 'lucide-react';
import { TYPES_COLORIAGE } from '@/lib/typesColoriage';

export const nomType = (v) => TYPES_COLORIAGE.find((t) => t.valeur === v)?.label || '';
export const nomAuteur = (x) => (x.pseudo ? `@${x.pseudo}` : x.name || 'Coloriste');
export const imagePage = (f) => `/api/pages/${f.id}/image?s=${f.img_size || 0}`;

export async function poster(url, corps, method = 'POST') {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  return r.ok ? r.json().catch(() => ({})) : null;
}

export function Avatar({ x, taille = 24 }) {
  return (
    <span style={{
      width: taille, height: taille, borderRadius: '50%', overflow: 'hidden', flex: '0 0 auto', background: 'var(--carte)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texte-secondaire)',
    }}>
      {x.a_avatar
        ? <img src={`/api/user/avatar?id=${x.auteur_id || x.user_id}&v=${new Date(x.avatar_maj).getTime()}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <User size={taille * 0.6} />}
    </span>
  );
}

export function BoutonJaime({ aime, likes, onClick, petit }) {
  return (
    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-label={aime ? "Je n'aime plus" : "J'aime"} aria-pressed={aime}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer',
        color: aime ? '#e0457b' : 'var(--texte-secondaire)', fontWeight: 700, padding: petit ? '4px' : '6px 8px',
        minHeight: '44px', fontSize: petit ? '0.8rem' : '0.9rem',
      }}>
      <Heart size={petit ? 16 : 20} fill={aime ? '#e0457b' : 'none'} /> {likes || 0}
    </button>
  );
}
