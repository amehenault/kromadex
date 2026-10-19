import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';

// Postes (noms affichés dans lib/postes.js) : coloriste, cheffe (1 mois), modo, admin (unique)
export const POSTES = [
  { valeur: 'coloriste', label: 'Coloriste' },
  { valeur: 'cheffe', label: 'Cheffe des coloristes (1 mois)' },
  { valeur: 'modo', label: 'Sentinelle du Kromadex' },
];

// Vérifie la session et le poste. Renvoie { profil } ou { erreur: NextResponse }
export async function exigerPoste(...postes) {
  const user = await getUser();
  if (!user) return { erreur: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };
  const profil = await getUserProfile(user.id);
  if (postes.length && !postes.includes(profil?.role)) {
    return { erreur: NextResponse.json({ error: 'Accès restreint' }, { status: 403 }) };
  }
  return { profil };
}

// Premier jour du mois au Québec, au format AAAA-MM-01 (décalage en mois possible)
export { premierDuMoisQuebec as premierDuMois } from '@/lib/temps';
