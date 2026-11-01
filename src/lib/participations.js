import { sql } from '@/lib/db';
import { categoriesBingoVisibles } from '@/lib/visibilite';

// Participations aux activités affichées dans la communauté.
// Les épreuves avec verdict ne s'affichent qu'une fois clôturées, pour garder le vote anonyme.
// Les combats et tournois restent anonymes : ils ne sont jamais affichés ici.
export async function participationsActivites(moi, { visibles, avant = null, suivis = false, limite = 20 }) {
  const lignes = await sql`
    SELECT x.*, p.title, p.tome, p.page_no, OCTET_LENGTH(p.image_b64) AS img_size,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime,
           (SELECT count(*)::int FROM page_commentaires c WHERE c.page_id = p.id) AS nb_commentaires,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj
    FROM (
      SELECT 'bingo' AS genre, b.id AS activite_id, b.titre AS nom_activite, c.user_id, c.page_id, min(c.cree_le) AS date
      FROM bingo_cases c JOIN bingos b ON b.id = c.bingo_id
      WHERE c.page_id IS NOT NULL AND c.valide IS NOT FALSE AND b.categorie = ANY(${categoriesBingoVisibles(visibles)})
      GROUP BY b.id, c.user_id, c.page_id
      UNION ALL
      SELECT a.genre, a.id, a.titre, s.user_id, s.page_id, s.cree_le
      FROM aventure_soumissions s JOIN aventures a ON a.id = s.aventure_id
      WHERE s.reussie AND (a.categorie = 'tous' OR a.categorie = ANY(${visibles}))
      UNION ALL
      SELECT 'defi_' || d.genre, d.id, d.titre, dp.user_id, dp.page_id, dp.cree_le
      FROM defi_participations dp JOIN defis d ON d.id = dp.defi_id
      WHERE dp.page_id IS NOT NULL AND (d.genre = 'groupe' OR d.cloture) AND (d.categorie = 'tous' OR d.categorie = ANY(${visibles}))
      UNION ALL
      SELECT 'defi_' || d.genre, d.id, d.titre, e.user_id, e.page_id, e.cree_le
      FROM defi_envois e JOIN defis d ON d.id = e.defi_id
      WHERE (d.genre = 'groupe' OR d.cloture) AND (d.categorie = 'tous' OR d.categorie = ANY(${visibles}))
        AND NOT EXISTS (SELECT 1 FROM defi_participations dp WHERE dp.defi_id = e.defi_id AND dp.page_id = e.page_id)
    ) x
    JOIN pages p ON p.id = x.page_id JOIN users u ON u.id = x.user_id
    WHERE p.image_b64 IS NOT NULL
      AND (${avant}::timestamptz IS NULL OR x.date < ${avant}::timestamptz)
      AND (${suivis}::boolean IS NOT TRUE OR x.user_id IN (SELECT suivi FROM abonnements WHERE suiveur = ${moi}))
    ORDER BY x.date DESC LIMIT ${limite}`;
  return lignes.map(({ page_id, ...l }) => ({ ...l, sorte: 'participation', id: page_id, cle: `${l.genre}-${l.activite_id}-${page_id}` }));
}
