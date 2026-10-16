import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserProfile } from '@/lib/user';

// Postes : coloriste (par défaut), cheffe (gagnante du défi mensuel, 1 mois), modo, admin (unique)
export const POSTES = [
  { valeur: 'coloriste', label: 'Coloriste' },
  { valeur: 'cheffe', label: 'Cheffe des coloristes (1 mois)' },
  { valeur: 'modo', label: 'Modératrice' },
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

// Premier jour du mois, au format AAAA-MM-01 (décalage en mois possible)
export function premierDuMois(decalage = 0) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + decalage);
  return d.toISOString().slice(0, 7) + '-01';
}
