import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';

// Quêtes du Destin : une page tirée par la Roue du Destin et ajoutée aux quêtes.
// 14 jours pour la colorier (un coloriage avec image, de ce tome et de cette page) : 10 XP.
// Passé ce délai sans coloriage, la quête disparaît. Une quête accomplie disparaît aussi de la liste (les XP restent).
import { JOURS_QUETE_DESTIN, XP_QUETE_DESTIN } from '@/lib/destin';
export { JOURS_QUETE_DESTIN, XP_QUETE_DESTIN };

// Met à jour les quêtes de la personne (pages ajustées, terminées, expirées) et renvoie celles en cours
export async function quetesDestin(userId) {
  // Le nombre de pages du tome a diminué (ex. 49 → 45) : la page tirée ne peut pas dépasser la dernière page
  await sql`
    UPDATE roue_tirages r SET page_no = x.total::text
    FROM (SELECT lower(nom) AS n, nb_pages AS total FROM tome_catalog WHERE nb_pages > 0 AND nom IS NOT NULL
          UNION ALL
          SELECT lower(nom), nb_pages FROM tomes_perso WHERE user_id = ${String(userId)} AND nb_pages > 0) x
    WHERE r.user_id = ${userId} AND r.quete_le IS NOT NULL AND r.termine_le IS NULL
      AND lower(r.tome) = x.n AND r.page_no ~ '^[0-9]+$' AND r.page_no::int > x.total`;
  await sql`DELETE FROM roue_tirages WHERE user_id = ${userId} AND quete_le IS NOT NULL AND termine_le IS NULL
    AND quete_le < now() - make_interval(days => ${JOURS_QUETE_DESTIN})`;
  // Accomplie : un coloriage avec image de ce tome et de cette page (la page était libre au tirage,
  // donc un coloriage existant pour elle a forcément été fait ou modifié pour la quête ;
  // une double page « 28-29 » accomplit la quête de la page 28 comme celle de la page 29)
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
