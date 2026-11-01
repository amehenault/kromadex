import { sql } from '@/lib/db';
import { mesTypesVisibles, categoriesBingoVisibles } from '@/lib/visibilite';

// Activités en cours que la personne n'a pas encore vues (points rouges de Épreuves, Bingos et Aventures).
async function activitesEnCours(userId) {
  const visibles = await mesTypesVisibles(userId);
  return sql`
    WITH jour AS (SELECT (now() AT TIME ZONE 'America/Toronto')::date AS j)
    SELECT 'epreuves' AS sorte, 'epreuve:' || d.id AS cle FROM defis d, jour
    WHERE d.genre <> 'groupe' AND NOT d.cloture AND (d.categorie = 'tous' OR d.categorie = ANY(${visibles}))
      AND d.debut <= jour.j AND d.fin >= jour.j
    UNION ALL
    SELECT 'bingos', 'bingo:' || b.id FROM bingos b, jour
    WHERE NOT b.cloture AND b.categorie = ANY(${categoriesBingoVisibles(visibles)})
      AND COALESCE(b.debut, b.cree_le::date) <= jour.j
      AND COALESCE(b.fin, (date_trunc('month', b.debut) + interval '1 month - 2 days')::date) >= jour.j
    UNION ALL
    SELECT 'aventures', 'aventure:' || a.id FROM aventures a, jour
    WHERE (a.categorie = 'tous' OR a.categorie = ANY(${visibles})) AND a.debut <= jour.j AND a.fin >= jour.j`;
}

export async function activitesNonVues(userId) {
  const enCours = await activitesEnCours(userId);
  const vues = new Set((await sql`SELECT cible FROM vues WHERE user_id = ${userId} AND genre = 'activite'`).map((v) => v.cible));
  const r = { epreuves: 0, bingos: 0, aventures: 0 };
  for (const a of enCours) if (!vues.has(a.cle)) r[a.sorte]++;
  return { ...r, total: r.epreuves + r.bingos + r.aventures };
}

export async function marquerActivitesVues(userId, sorte) {
  const cles = (await activitesEnCours(userId)).filter((a) => !sorte || a.sorte === sorte).map((a) => a.cle);
  if (cles.length) {
    await sql`INSERT INTO vues (user_id, genre, cible) SELECT ${userId}, 'activite', unnest(${cles}::text[]) ON CONFLICT DO NOTHING`;
  }
}
