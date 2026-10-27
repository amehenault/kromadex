import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';

export const POSTES = [
  { valeur: 'coloriste', label: 'Coloriste' },
  { valeur: 'cheffe', label: 'Cheffe des coloristes (1 mois)' },
  { valeur: 'modo', label: 'Sentinelle du Kromadex' },
  { valeur: 'menestrel', label: 'Ménestrelle (1 épreuve et 1 bingo par mois)' },
];

export async function exigerPoste(...postes) {
  const user = await getUser();
  if (!user) return { erreur: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };
  const profil = await getUserProfile(user.id);
  if (postes.length && !postes.includes(profil?.role)) {
    return { erreur: NextResponse.json({ error: 'Accès restreint' }, { status: 403 }) };
  }
  return { profil };
}

export { premierDuMoisQuebec as premierDuMois } from '@/lib/temps';
