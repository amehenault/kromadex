'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Plus, User } from 'lucide-react';

// Menu du bas (icônes seules) : Épreuves à gauche, + au centre (ajouter un coloriage), Profil à droite
export default function MenuBas({ avatar }) {
  const chemin = usePathname() || '/';
  const surDefis = chemin === '/' || chemin.startsWith('/defis') || chemin.startsWith('/communaute');
  const surProfil = chemin.startsWith('/profil');

  return (
    <nav className="menu-bas" aria-label="Navigation principale">
      <Link href="/" aria-label="Épreuves" aria-current={surDefis ? 'page' : undefined}
        className={`menu-bas-lien${surDefis ? ' actif' : ''}`}>
        <Trophy size={28} aria-hidden="true" />
      </Link>
      <Link href="/pages/new" className="menu-bas-plus" aria-label="Ajouter un coloriage">
        <Plus size={32} aria-hidden="true" />
      </Link>
      <Link href="/profil" aria-label="Profil" aria-current={surProfil ? 'page' : undefined}
        className={`menu-bas-lien${surProfil ? ' actif' : ''}`}>
        {avatar
          ? <img src={avatar} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--blanc)' }} />
          : <User size={28} aria-hidden="true" />}
      </Link>
    </nav>
  );
}
