import '@/styles/root.css';
import '@/styles/base.css';
import '@/styles/components.css';
import Header from '@/components/Header';
import MenuBas from '@/components/MenuBas';
import SondagesTermines from '@/components/SondagesTermines';
import XPGagnes from '@/components/XPGagnes';
import SansZoom from '@/components/SansZoom';
import { FuseauProvider } from '@/components/Fuseau';
import { GenreProvider } from '@/components/Genre';
import { fuseauDuPays } from '@/lib/pays';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { noterConnexion } from '@/lib/series';

export const metadata = { 
  title: 'Kromadex', 
  manifest: '/manifest.webmanifest', 
  appleWebApp: { capable: true, title: 'Kromadex' },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = { 
  themeColor: '#4bbca1',
  viewportFit: 'cover', 
  width: 'device-width', 
  initialScale: 1,
  // Pas de zoom à deux doigts : l'appli se comporte comme une appli installée
  maximumScale: 1,
  userScalable: false,
};

export default async function Layout({ children }) {
  const user = await getUser();
  // Visite du jour (série de connexion) ; une erreur ici ne doit jamais bloquer l'affichage
  if (user) await noterConnexion(user.id).catch(() => {});
  // Photo de profil du menu (versionnée pour éviter le cache), pays de la personne (pour le fuseau horaire)
  // et son genre (pour accorder les textes : le féminin prime)
  const [a] = user ? await sql`SELECT avatar_maj, avatar_b64 IS NOT NULL AS a_avatar, pays, genre FROM users WHERE id = ${user.id}` : [];
  const avatar = a?.a_avatar ? `/api/user/avatar?v=${new Date(a.avatar_maj).getTime()}` : null;
  return (
    <html lang="fr">
      <body>
        <FuseauProvider fuseau={fuseauDuPays(a?.pays)}>
          <GenreProvider genre={a?.genre}>
            <SansZoom />
            <Header />
            <main className={user ? 'contenu avec-menu-bas' : 'contenu'}>{children}</main>
            {user && <MenuBas avatar={avatar} />}
            {user && <SondagesTermines />}
            {user && <XPGagnes />}
          </GenreProvider>
        </FuseauProvider>
      </body>
    </html>
  );
}