import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';

// Quêtes du Destin : une page tirée par la Roue du Destin et ajoutée aux quêtes.
// 14 jours pour la colorier (un coloriage de ce tome et de cette page enregistré après l'ajout) : 10 XP.
// Passé ce délai sans coloriage, la quête disparaît.
export const JOURS_QUETE_DESTIN = 14;
export const XP_QUETE_DESTIN = 10;

// Met à jour les quêtes de la personne (terminées, expirées) et renvoie celles en cours et les terminées récemment
export async function quetesDestin(userId) {
  await sql`DELETE FROM roue_tirages WHERE user_id = ${userId} AND quete_le IS NOT NULL AND termine_le IS NULL
    AND quete_le < now() - make_interval(days => ${JOURS_QUETE_DESTIN})`;
  const finies = await sql`
    UPDATE roue_tirages r SET termine_le = now()
    WHERE r.user_id = ${userId} AND r.quete_le IS NOT NULL AND r.termine_le IS NULL
      AND EXISTS (SELECT 1 FROM pages p WHERE p.user_id = ${userId} AND lower(p.tome) = lower(r.tome)
                    AND p.page_no = r.page_no AND p.created_at >= r.quete_le)
    RETURNING r.id`;
  for (const f of finies) await accorderXP(userId, `destin:${f.id}`, XP_QUETE_DESTIN);
  return sql`
    SELECT id, tome, page_no, termine_le, quete_le + make_interval(days => ${JOURS_QUETE_DESTIN}) AS fin
    FROM roue_tirages
    WHERE user_id = ${userId} AND quete_le IS NOT NULL AND (termine_le IS NULL OR termine_le > now() - interval '7 days')
    ORDER BY termine_le NULLS FIRST, quete_le DESC`;
}
