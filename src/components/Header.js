'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, User, LogOut } from 'lucide-react';

export default function Header({ connecte, avatar }) {
  const r = useRouter();

  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login');
    r.refresh();
  }

  return (
    <header className="entete">
      <h1>
        <Link href="/" className="entete-logo">
          <img src="/logo.svg" alt="Kromadex" />
        </Link>
      </h1>

      {connecte && (
        <div className="entete-actions">
          <Link
            href="/communaute"
            className="btn-icon"
            title="Communauté"
            aria-label="Communauté"
          >
            <Users size={22} aria-hidden="true" />
          </Link>

          <Link
            href="/profil"
            className="btn-icon"
            title="Profil"
            aria-label="Profil"
          >
            {avatar ? (
              <img
                src={avatar}
                alt=""
                width={30}
                height={30}
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <User size={22} aria-hidden="true" />
            )}
          </Link>

          <button
            type="button"
            className="btn-icon"
            onClick={sortir}
            title="Déconnexion"
            aria-label="Déconnexion"
          >
            <LogOut size={22} aria-hidden="true" />
          </button>
        </div>
      )}
    </header>
  );
}