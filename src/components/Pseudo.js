import { couleurPoste } from '@/lib/postes';

// Pseudo (ou nom à défaut) affiché dans la couleur du poste de la personne (couleurs des rôles dans root.css)
export default function Pseudo({ x, role, repli = 'Coloriste', style }) {
  const texte = x?.pseudo ? `@${x.pseudo}` : x?.name || x?.email || repli;
  return (
    <span style={{ color: couleurPoste(role ?? x?.role), fontWeight: 700, overflowWrap: 'anywhere', ...style }}>
      {texte}
    </span>
  );
}
