'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header({ connecte, avatar }) {
  const r = useRouter();
  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login'); r.refresh();
  }
  return (
    <header className="entete">
      <h1>Kromadex</h1>
      {connecte && (
        <div className="entete-actions">
          <Link href="/profil" className="btn-icon" title="Profil">
            {avatar
              ? <img src={avatar} alt="Profil" width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              : <img src="/profil.svg" alt="Profil" width={22} height={22} />}
          </Link>
          <button className="btn alt" onClick={sortir}>Déconnexion</button>
        </div>
      )}
    </header>
  );
}
