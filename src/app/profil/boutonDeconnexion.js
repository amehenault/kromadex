'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { POLITIQUE_CONFIDENTIALITE, CONDITIONS_UTILISATION } from '@/lib/pagesLegales';

const PAGES_LEGALES = [
  { href: POLITIQUE_CONFIDENTIALITE, label: 'Politique de confidentialité' },
  { href: CONDITIONS_UTILISATION, label: 'Conditions d’utilisation' },
];

// Déconnexion : bouton corail pleine largeur, tout en bas du profil, puis les pages légales (soulignées, une sous l'autre)
export default function BoutonDeconnexion() {
  const r = useRouter();
  async function sortir() {
    // Les notifications de ce compte s'arrêtent sur cet appareil (ex. appareil partagé)
    try {
      const abonnement = await (await navigator.serviceWorker?.getRegistration())?.pushManager.getSubscription();
      if (abonnement) {
        await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: abonnement.endpoint }) });
        await abonnement.unsubscribe();
      }
    } catch {}
    await fetch('/api/auth/logout', { method: 'POST' });
    r.replace('/login');
    r.refresh();
  }
  return (
    <>
      <button type="button" className="btn btn-corail" onClick={sortir}
        style={{ display: 'flex', width: '100%', minHeight: '52px', boxSizing: 'border-box', gap: '8px', fontWeight: 700, marginBottom: 'var(--espace-2)' }}>
        <LogOut size={20} aria-hidden="true" />
        <span>Déconnexion</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--espace-3)' }}>
        {PAGES_LEGALES.map((p) => (
          <a key={p.href} href={p.href} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--texte-secondaire)', textDecoration: 'underline', fontSize: '0.85rem', padding: '10px 8px', minHeight: '44px', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center' }}>
            {p.label}
          </a>
        ))}
      </div>
    </>
  );
}
