import { sql } from '@/lib/db';
import { rappelsDuJour } from '@/lib/planification';

// Contenu à lire : missives publiées non lues, réponses de l'Invocatrice pas encore vues,
// et pour l'Invocatrice, les nouvelles demandes d'aide (elle n'a pas de missives à lire : elle les écrit).
// Invocatrice et Sentinelles : contenus et mots-clefs signalés à traiter, cases de bingo à valider.
// Invocatrice : missives de Sentinelles à approuver, inscriptions arrivées depuis sa dernière visite de Lancement,
// activités à planifier (Activités à venir).
// Tout le monde : invitations à un duel pas encore acceptées ni refusées.
// Sondages : ceux qui sont terminés et dont on n'a pas encore vu le résultat final (si on a voté ou si on l'a écrit)
// Chaque notification envoyée correspond à un de ces nombres : sa pastille reste tant que ce n'est pas traité.
export async function aLire(userId) {
  const [r] = await sql`
    SELECT
      u.role,
      CASE WHEN u.role = 'admin' THEN 0 ELSE
        (SELECT count(*)::int FROM missives m
          WHERE m.statut = 'publiee'
            AND NOT EXISTS (SELECT 1 FROM missives_lues l WHERE l.missive_id = m.id AND l.user_id = u.id)) END AS missives,
      (SELECT count(*)::int FROM missives m
        WHERE m.statut = 'publiee' AND m.sondage_fin <= now()
          AND (m.auteur = u.id OR EXISTS (SELECT 1 FROM missive_votes v WHERE v.missive_id = m.id AND v.user_id = u.id))
          AND NOT EXISTS (SELECT 1 FROM sondages_vus s WHERE s.missive_id = m.id AND s.user_id = u.id)) AS sondages,
      (SELECT count(*)::int FROM demandes WHERE user_id = u.id AND NOT reponse_vue) AS reponses,
      CASE WHEN u.role = 'admin' THEN (SELECT count(*)::int FROM demandes WHERE statut = 'nouvelle') ELSE 0 END AS demandes,
      -- Invocatrice et Sentinelles : contenus signalés pas encore traités (Contenu signalé) et mots-clefs signalés (Mots-clefs)
      CASE WHEN u.role IN ('admin', 'modo') THEN
        (SELECT count(*)::int FROM (SELECT DISTINCT genre, cible FROM signalements WHERE NOT traite) s)
        + (SELECT count(*)::int FROM (SELECT DISTINCT defi_id, page_id FROM defi_signalements WHERE NOT traite) d)
      ELSE 0 END AS signales,
      CASE WHEN u.role IN ('admin', 'modo') THEN (SELECT count(DISTINCT mot_cle_id)::int FROM mot_cle_signalements) ELSE 0 END AS mots_cles_signales,
      -- Invocatrice et Sentinelles : cases de bingo en attente de validation (Validation des bingos)
      CASE WHEN u.role IN ('admin', 'modo') THEN
        (SELECT count(*)::int FROM bingo_cases WHERE valide IS NULL AND page_id IS NOT NULL) ELSE 0 END AS validation,
      -- Invocatrice : missives de Sentinelles à approuver (Missives) et nouvelles inscriptions (Lancement)
      CASE WHEN u.role = 'admin' THEN (SELECT count(*)::int FROM missives WHERE statut = 'en_attente') ELSE 0 END AS missives_attente,
      CASE WHEN u.role = 'admin' THEN
        (SELECT count(*)::int FROM users n WHERE n.role <> 'admin' AND n.created_at > COALESCE(u.lancement_vu, now())) ELSE 0 END AS inscriptions,
      -- Invitations à un duel en attente de réponse (Combats)
      (SELECT count(*)::int FROM combats c WHERE c.invite = u.id AND c.statut = 'invitation') AS invitations
    FROM users u WHERE u.id = ${userId}`;
  if (!r) return { missives: 0, sondages: 0, reponses: 0, demandes: 0, signales: 0, mots_cles_signales: 0, validation: 0, missives_attente: 0, inscriptions: 0, invitations: 0, rappels: 0, espace: 0, total: 0 };
  const { role, ...d } = r;
  // Invocatrice : activités à planifier (rappels de Activités à venir)
  d.rappels = role === 'admin' ? (await rappelsDuJour()).length : 0;
  // Nombre affiché sur le bouton de l'Espace (Invocatrice ou Sentinelle) : tout ce qui se traite dans ses onglets
  d.espace = d.demandes + d.signales + d.mots_cles_signales + d.validation + d.missives_attente + d.inscriptions;
  // Pastille de la photo de profil (menu du bas) : tout ce qui attend, quel que soit l'endroit
  d.total = d.missives + d.sondages + d.reponses + d.espace + d.invitations + d.rappels;
  return d;
}
