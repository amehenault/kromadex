'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

// Déconnexion : bouton corail pleine largeur, tout en bas du profil
export default function BoutonDeconnexion() {
  const r = useRouter();
  async function sortir() {
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login');
    r.refresh();
  }
  return (
    <button type="button" className="btn btn-corail" onClick={sortir}
      style={{ display: 'flex', width: '100%', minHeight: '52px', boxSizing: 'border-box', gap: '8px', fontWeight: 700, marginBottom: 'var(--espace-3)' }}>
      <LogOut size={20} aria-hidden="true" />
      <span>Déconnexion</span>
    </button>
  );
}
