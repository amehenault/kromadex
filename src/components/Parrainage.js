'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, Copy, Share2, Check } from 'lucide-react';
import Pseudo from './Pseudo';
import { Avatar } from '@/app/communaute/outils';

export default function Parrainage({ code, filleules = [] }) {
  const [lien, setLien] = useState('');
  const [copie, setCopie] = useState(false);
  useEffect(() => { if (code) setLien(`${window.location.origin}/login?parrain=${code}`); }, [code]);
  if (!code) return null;

  async function partager() {
    const texte = 'Viens colorier avec moi sur Kromadex !';
    if (navigator.share) { await navigator.share({ title: 'Kromadex', text: texte, url: lien }).catch(() => {}); return; }
    await navigator.clipboard?.writeText(lien).catch(() => {});
    setCopie(true); setTimeout(() => setCopie(false), 2000);
  }
  async function copier() {
    await navigator.clipboard?.writeText(lien).catch(() => {});
    setCopie(true); setTimeout(() => setCopie(false), 2000);
  }

  const bouton = { minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, flex: 1, minWidth: 0 };
  return (
    <section className="carte" style={{ marginBottom: 'var(--espace-3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
        <HeartHandshake size={20} aria-hidden="true" style={{ color: 'var(--btn)' }} /> Inviter une amie
      </b>
      <small style={{ color: 'var(--texte-secondaire)' }}>
        Partage ton lien personnel. Quand ton amie s’inscrit avec ce lien et publie son premier coloriage dans la communauté, tu gagnes le badge de parrainage
        et tu débloques le cadre de parrainage.
      </small>
      <input readOnly value={lien} aria-label="Mon lien d’invitation" onFocus={(e) => e.target.select()} style={{ width: '100%', margin: 0, fontSize: '0.85rem' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" className="btn" style={bouton} onClick={partager}><Share2 size={16} aria-hidden="true" /> Partager</button>
        <button type="button" className="btn alt" style={bouton} onClick={copier}>
          {copie ? <><Check size={16} aria-hidden="true" /> Copié</> : <><Copy size={16} aria-hidden="true" /> Copier le lien</>}
        </button>
      </div>
      {filleules.length > 0 && (
        <>
          <small style={{ fontWeight: 700 }}>Mes invitées ({filleules.length})</small>
          {filleules.map((f) => (
            <Link key={f.id} href={`/membre/${f.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
              <Avatar x={{ ...f, auteur_id: f.id }} taille={28} />
              <small style={{ flex: 1, minWidth: 0 }}><Pseudo x={f} /></small>
              <small style={{ flex: '0 0 auto', color: f.validee ? 'var(--btn)' : 'var(--texte-secondaire)', fontWeight: 700 }}>
                {f.validee ? 'Badge gagné' : 'En attente de son 1er coloriage publié'}
              </small>
            </Link>
          ))}
        </>
      )}
    </section>
  );
}
