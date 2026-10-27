import { couleurPoste } from '@/lib/postes';

export default function Pseudo({ x, role, repli = 'Coloriste', style }) {
  const texte = x?.pseudo ? `@${x.pseudo}` : x?.name || x?.email || repli;
  return (
    <span style={{ color: couleurPoste(role ?? x?.role), fontWeight: 700, overflowWrap: 'anywhere', ...style }}>
      {texte}
    </span>
  );
}
