import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bell, Frame, UserCog, Crown, PlayCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { PageParametres } from './parametres';

export const dynamic = 'force-dynamic';

// Paramètres : un menu simple, chaque entrée ouvre sa propre page
const ENTREES = [
  { href: '/parametres/notifications', label: 'Notifications', icone: Bell },
  { href: '/parametres/titre-et-cadre', label: 'Titre et cadre affichés', icone: Frame },
  { href: '/parametres/informations', label: 'Mes informations', aide: 'Photo de profil, préférences de coloriage, courriel et mot de passe', icone: UserCog },
  { href: '/kromadex-plus', label: 'Mon abonnement Kromadex+', icone: Crown },
  { href: '/?tutoriel=1', label: 'Revoir la présentation de Kromadex', icone: PlayCircle },
  { href: '/aide', label: 'Aide', icone: HelpCircle },
];

export default async function ParametresPage() {
  if (!(await getUser())) redirect('/login');
  return (
    <PageParametres titre="Paramètres" retour="/profil">
      <nav className="carte" aria-label="Paramètres" style={{ display: 'flex', flexDirection: 'column', padding: '4px 16px' }}>
        {ENTREES.map(({ href, label, aide, icone: Icone }, i) => (
          <Link key={href} href={href}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', minHeight: '56px', padding: '8px 0', color: 'inherit', textDecoration: 'none',
              borderTop: i ? '1px solid var(--bordure-carte)' : 'none',
            }}>
            <Icone size={22} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--btn)' }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '0.98rem' }}>{label}</b>
              {aide && <small style={{ color: 'var(--texte-secondaire)' }}>{aide}</small>}
            </span>
            <ChevronRight size={18} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--texte-secondaire)' }} />
          </Link>
        ))}
      </nav>
    </PageParametres>
  );
}
