import Link from 'next/link';

// Bandeau corail du haut : seulement le logo.
// La navigation est dans le menu du bas (MenuBas), la déconnexion dans le profil.
export default function Header() {
  return (
    <header className="entete entete-logo-seul">
      <h1>
        <Link href="/" className="entete-logo">
          <img src="/logo.svg" alt="Kromadex" />
        </Link>
      </h1>
    </header>
  );
}
