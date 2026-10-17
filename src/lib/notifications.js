import { sql } from '@/lib/db';

// Contenu à lire : missives publiées non lues et réponses de l'Invocatrice pas encore vues
export async function aLire(userId) {
  const [r] = await sql`
    SELECT
      (SELECT count(*)::int FROM missives m
        WHERE m.statut = 'publiee'
          AND NOT EXISTS (SELECT 1 FROM missives_lues l WHERE l.missive_id = m.id AND l.user_id = ${userId})) AS missives,
      (SELECT count(*)::int FROM demandes WHERE user_id = ${userId} AND NOT reponse_vue) AS reponses`;
  return r;
}
