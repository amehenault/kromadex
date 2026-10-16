'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, LogOut } from 'lucide-react';

export default function Header({ connecte, avatar }) {
  const r = useRouter();
  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login'); r.refresh();
  }
  return (
    <header className="entete">
      <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Kromadex</Link></h1>
      {connecte && (
        <div className="entete-actions">
          <Link href="/communaute" className="btn-icon" title="Communauté" aria-label="Communauté">
            <Users size={22} />
          </Link>
          <Link href="/profil" className="btn-icon" title="Profil">
            {avatar
              ? <img src={avatar} alt="Profil" width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              : <img src="/profil.svg" alt="Profil" width={22} height={22} />}
          </Link>
          <button type="button" className="btn-icon" onClick={sortir} title="Déconnexion" aria-label="Déconnexion">
            <LogOut size={22} />
          </button>
        </div>
      )}
    </header>
  );
}
