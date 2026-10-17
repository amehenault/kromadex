import Link from 'next/link';

// Message d'erreur ; quand il parle de Kromadex+ (limite de la version gratuite), tout le message
// devient un lien vers la page Kromadex+
export default function TexteErreur({ texte }) {
  if (!texte) return null;
  if (!String(texte).includes('Kromadex+')) return texte;
  return (
    <Link href="/kromadex-plus" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>
      {texte}
    </Link>
  );
}
