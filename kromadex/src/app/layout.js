import '@/styles/root.css';
import '@/styles/base.css';
import '@/styles/components.css';
import Header from '@/components/Header';
import { getUser } from '@/lib/auth';

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
  return (
    <html lang="fr">
      <body>
        <Header connecte={!!user} />
        <main className="contenu">{children}</main>
      </body>
    </html>
  );
}