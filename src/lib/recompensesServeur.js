import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';
import { RECOMPENSES } from '@/lib/recompenses';

// Donne une récompense une seule fois (même type et même source). Renvoie true si elle est nouvelle.
// xp : XP gagnés avec cette victoire (servent au classement du Podium de l'Assemblée, ils ne sont pas versés ici)
export async function donnerRecompense(userId, { genre, detail = '', source, image = '', xp = 0, victoire = false }) {
  if (!userId || !RECOMPENSES[genre]) return false;
  const r = await sql`
    INSERT INTO recompenses (user_id, genre, detail, source, image, xp, victoire)
    VALUES (${userId}, ${genre}, ${detail}, ${source}, ${image}, ${xp}, ${victoire})
    ON CONFLICT (user_id, genre, source) DO NOTHING RETURNING 1`;
  return r.length > 0;
}

// Débloque un titre pour la personne (le titre est créé au besoin dans la liste des titres)
export async function donnerTitre(userId, nom) {
  const titre = String(nom || '').trim().slice(0, 60);
  if (!userId || !titre) return;
  await sql`INSERT INTO system_titles (name, description) VALUES (${titre}, 'Titre gagné lors d’une activité') ON CONFLICT (name) DO NOTHING`;
  await sql`
    UPDATE users SET unlocked_titles = COALESCE(unlocked_titles, '[]'::jsonb) || to_jsonb(${titre}::text)
    WHERE id = ${userId} AND NOT (COALESCE(unlocked_titles, '[]'::jsonb) ? ${titre})`;
}

// Victoire : verse les XP (une seule fois) et donne la récompense
export async function recompenserVictoire(userId, { cleXP, xp, ...recompense }) {
  if (!userId) return;
  if (xp) await accorderXP(userId, cleXP, xp);
  await donnerRecompense(userId, { ...recompense, xp, victoire: true });
}

// Récompenses d'une personne, les plus récentes en premier
export async function recompensesDe(userId) {
  return sql`SELECT id, genre, detail, source, image, xp, utilise, cree_le FROM recompenses WHERE user_id = ${userId} ORDER BY cree_le DESC`;
}

// Parchemins du Destin pas encore utilisés
export async function parcheminsDisponibles(userId) {
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM recompenses WHERE user_id = ${userId} AND genre = 'parchemin' AND NOT utilise`;
  return n;
}

// Utilise un Parchemin du Destin (le plus ancien). Renvoie false s'il n'y en a plus.
export async function utiliserParchemin(userId) {
  const r = await sql`
    UPDATE recompenses SET utilise = true
    WHERE id = (SELECT id FROM recompenses WHERE user_id = ${userId} AND genre = 'parchemin' AND NOT utilise ORDER BY cree_le LIMIT 1)
    RETURNING id`;
  return r.length > 0;
}

// Rend un parchemin (si la soumission qui l'utilisait est refusée)
export async function rendreParchemin(userId) {
  await sql`
    UPDATE recompenses SET utilise = false
    WHERE id = (SELECT id FROM recompenses WHERE user_id = ${userId} AND genre = 'parchemin' AND utilise ORDER BY cree_le DESC LIMIT 1)`;
}

// Podium de l'Assemblée : les gagnant·es des 30 derniers jours, classé·es selon les XP de leurs victoires
// (clés victoire:... du journal d'XP), avec les récompenses gagnées pendant cette période
export async function podium() {
  return sql`
    SELECT u.id AS user_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           v.xp, v.victoires,
           COALESCE((SELECT json_agg(json_build_object('genre', r.genre, 'detail', r.detail, 'image', r.image, 'cree_le', r.cree_le) ORDER BY r.cree_le DESC)
                     FROM recompenses r WHERE r.user_id = u.id AND r.cree_le > now() - interval '30 days'), '[]') AS recompenses
    FROM (SELECT user_id, sum(xp)::int AS xp, count(*)::int AS victoires, max(cree_le) AS derniere
          FROM xp_journal WHERE cle LIKE 'victoire:%' AND cree_le > now() - interval '30 days'
          GROUP BY user_id) v
    JOIN users u ON u.id = v.user_id
    ORDER BY v.xp DESC, v.derniere DESC
    LIMIT 20`;
}
