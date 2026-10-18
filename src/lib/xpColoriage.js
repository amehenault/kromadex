import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';
import { XP_PAGE } from '@/lib/niveaux';

// XP d'un coloriage : seulement quand une vraie image y est ajoutée (une fiche sans image reste un brouillon),
// une seule fois par fiche (clé page:<id>), et au plus XP_COLORIAGES_PAR_JOUR fiches récompensées par 24 heures.
export const XP_COLORIAGES_PAR_JOUR = 10;

export async function accorderXPColoriage(userId, pageId) {
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM xp_journal
    WHERE user_id = ${userId} AND cle LIKE 'page:%' AND cree_le > now() - interval '24 hours'`;
  if (n >= XP_COLORIAGES_PAR_JOUR) return false;
  return accorderXP(userId, `page:${pageId}`, XP_PAGE);
}
