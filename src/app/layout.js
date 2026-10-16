import '@/styles/root.css';
import '@/styles/base.css';
import '@/styles/components.css';
import Header from '@/components/Header';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';

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
  initialScale: 1 
};

export default async function Layout({ children }) {
  const user = await getUser();
  // Photo de profil pour l'icône du haut (versionnée pour éviter le cache)
  const [a] = user ? await sql`SELECT avatar_maj FROM users WHERE id = ${user.id} AND avatar_b64 IS NOT NULL` : [];
  const avatar = a ? `/api/user/avatar?v=${new Date(a.avatar_maj).getTime()}` : null;
  return (
    <html lang="fr">
      <body>
        <Header connecte={!!user} avatar={avatar} />
        <main className="contenu">{children}</main>
      </body>
    </html>
  );
}