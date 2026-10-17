'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

// Déconnexion, placée dans le profil
export default function BoutonDeconnexion() {
  const r = useRouter();
  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login');
    r.refresh();
  }
  return (
    <button type="button" className="btn profil-acces-lien" onClick={sortir}>
      <LogOut size={22} aria-hidden="true" />
      <span>Déconnexion</span>
    </button>
  );
}
