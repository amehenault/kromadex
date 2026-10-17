import { sql } from '@/lib/db';

// Contenu à lire : missives publiées non lues, réponses de l'Invocatrice pas encore vues,
// et pour l'Invocatrice, les nouvelles demandes d'aide (elle n'a pas de missives à lire : elle les écrit)
export async function aLire(userId) {
  const [r] = await sql`
    SELECT
      CASE WHEN u.role = 'admin' THEN 0 ELSE
        (SELECT count(*)::int FROM missives m
          WHERE m.statut = 'publiee'
            AND NOT EXISTS (SELECT 1 FROM missives_lues l WHERE l.missive_id = m.id AND l.user_id = u.id)) END AS missives,
      (SELECT count(*)::int FROM demandes WHERE user_id = u.id AND NOT reponse_vue) AS reponses,
      CASE WHEN u.role = 'admin' THEN (SELECT count(*)::int FROM demandes WHERE statut = 'nouvelle') ELSE 0 END AS demandes
    FROM users u WHERE u.id = ${userId}`;
  return r || { missives: 0, reponses: 0, demandes: 0 };
}
