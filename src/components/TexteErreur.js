import Link from 'next/link';

export default function TexteErreur({ texte }) {
  if (!texte) return null;
  if (!String(texte).includes('Kromadex+')) return texte;
  return (
    <Link href="/kromadex-plus" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>
      {texte}
    </Link>
  );
}
