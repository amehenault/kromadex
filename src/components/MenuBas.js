'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Plus, User } from 'lucide-react';

// Menu du bas (icônes seules) : Épreuves à gauche, + au centre (ajouter un coloriage), Profil à droite.
// Une pastille sur le profil signale une missive non lue ou une réponse de l'Invocatrice.
export default function MenuBas({ avatar }) {
  const chemin = usePathname() || '/';
  const surDefis = chemin === '/' || chemin.startsWith('/defis') || chemin.startsWith('/communaute');
  const surProfil = chemin.startsWith('/profil');
  const [aLire, setALire] = useState(false);

  useEffect(() => {
    const verifier = () => fetch('/api/notifications').then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setALire(d.missives + (d.sondages || 0) + d.reponses + (d.demandes || 0) + (d.signales || 0) + (d.mots_cles_signales || 0) > 0)).catch(() => {});
    verifier();
    window.addEventListener('kromadex-lu', verifier);
    return () => window.removeEventListener('kromadex-lu', verifier);
  }, [chemin]);

  return (
    <nav className="menu-bas" aria-label="Navigation principale">
      <Link href="/" aria-label="Épreuves" aria-current={surDefis ? 'page' : undefined}
        className={`menu-bas-lien${surDefis ? ' actif' : ''}`}>
        <Trophy size={28} aria-hidden="true" />
      </Link>
      <Link href="/pages/new" className="menu-bas-plus" aria-label="Ajouter un coloriage">
        <Plus size={32} aria-hidden="true" />
      </Link>
      <Link href="/profil" aria-label={aLire ? 'Profil, contenu à lire' : 'Profil'} aria-current={surProfil ? 'page' : undefined}
        className={`menu-bas-lien${surProfil ? ' actif' : ''}`} style={{ position: 'relative' }}>
        {avatar
          ? <img src={avatar} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--blanc)' }} />
          : <User size={28} aria-hidden="true" />}
        {aLire && <span className="pastille pastille-coin" aria-hidden="true" />}
      </Link>
    </nav>
  );
}
