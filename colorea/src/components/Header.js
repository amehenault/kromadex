'use client';
import { useRouter } from 'next/navigation';

export default function Header({ connecte }) {
  const r = useRouter();
  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login'); r.refresh();
  }
  return (
    <header className="entete">
      <h1>Mes coloriages mystères 🎨</h1>
      {connecte && <button className="btn alt" onClick={sortir}>Déconnexion</button>}
    </header>
  );
}
