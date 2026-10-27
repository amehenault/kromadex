import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';

import { JOURS_QUETE_DESTIN, XP_QUETE_DESTIN } from '@/lib/destin';
export { JOURS_QUETE_DESTIN, XP_QUETE_DESTIN };

export async function quetesDestin(userId) {
  await sql`
    UPDATE roue_tirages r SET page_no = x.total::text
    FROM (SELECT lower(nom) AS n, nb_pages AS total FROM tome_catalog WHERE nb_pages > 0 AND nom IS NOT NULL
          UNION ALL
          SELECT lower(nom), nb_pages FROM tomes_perso WHERE user_id = ${String(userId)} AND nb_pages > 0) x
    WHERE r.user_id = ${userId} AND r.quete_le IS NOT NULL AND r.termine_le IS NULL
      AND lower(r.tome) = x.n AND r.page_no ~ '^[0-9]+$' AND r.page_no::int > x.total`;
  await sql`DELETE FROM roue_tirages WHERE user_id = ${userId} AND quete_le IS NOT NULL AND termine_le IS NULL
    AND quete_le < now() - make_interval(days => ${JOURS_QUETE_DESTIN})`;
  const finies = await sql`
    UPDATE roue_tirages r SET termine_le = now()
    WHERE r.user_id = ${userId} AND r.quete_le IS NOT NULL AND r.termine_le IS NULL
      AND EXISTS (SELECT 1 FROM pages p WHERE p.user_id = ${userId} AND lower(trim(p.tome)) = lower(trim(r.tome))
                    AND trim(r.page_no) = ANY(string_to_array(trim(p.page_no), '-')) AND p.image_b64 IS NOT NULL)
    RETURNING r.id`;
  for (const f of finies) await accorderXP(userId, `destin:${f.id}`, XP_QUETE_DESTIN);
  return sql`
    SELECT id, tome, page_no, quete_le + make_interval(days => ${JOURS_QUETE_DESTIN}) AS fin
    FROM roue_tirages
    WHERE user_id = ${userId} AND quete_le IS NOT NULL AND termine_le IS NULL
    ORDER BY quete_le DESC`;
}
