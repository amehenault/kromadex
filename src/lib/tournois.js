import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';
import { gagnantVerdict } from '@/lib/verdicts';
import { donnerRecompense } from '@/lib/recompensesServeur';
import { TOURNOIS, XP_TOURNOI, GENRES_TOURNOI } from '@/lib/activites';


const SOUMISSION = TOURNOIS.joursSoumission;
const VERDICT = TOURNOIS.joursSoumission + TOURNOIS.joursVerdict;

async function creerRonde(tournoiId, ronde, joueurs) {
  for (let i = 0; i < joueurs.length; i += 2) {
    await sql`
      INSERT INTO tournoi_matchs (tournoi_id, ronde, ordre, joueur_a, joueur_b, soumission_fin, verdict_fin)
      VALUES (${tournoiId}, ${ronde}, ${i / 2 + 1}, ${joueurs[i]}, ${joueurs[i + 1]},
              now() + make_interval(days => ${SOUMISSION}), now() + make_interval(days => ${VERDICT}))
      ON CONFLICT DO NOTHING`;
  }
  if (joueurs.length === 2) for (const j of joueurs) await accorderXP(j, `tournoi:${tournoiId}:finale`, XP_TOURNOI.finale);
}

export async function demarrerTournoi(tournoiId) {
  const fige = await sql`
    UPDATE tournois t SET statut = 'en_cours', ronde = 1, taille = (SELECT count(*) FROM tournoi_inscrits i WHERE i.tournoi_id = t.id)
    WHERE t.id = ${tournoiId} AND t.statut = 'inscriptions' RETURNING id`;
  if (!fige.length) return;
  const inscrits = await sql`SELECT user_id FROM tournoi_inscrits WHERE tournoi_id = ${tournoiId} ORDER BY random()`;
  for (const i of inscrits) await accorderXP(i.user_id, `tournoi:${tournoiId}`, XP_TOURNOI.participation);
  await creerRonde(tournoiId, 1, inscrits.map((i) => i.user_id));
}

async function deciderMatch(m) {
  const pages = [m.page_a && 'a', m.page_b && 'b'].filter(Boolean);
  let gagnant = null;
  if (pages.length === 2) {
    if (new Date(m.verdict_fin) > new Date()) return;
    gagnant = await gagnantVerdict(`match:${m.id}`, [
      { user_id: m.joueur_a, page_id: m.page_a, soumis_le: m.soumis_a },
      { user_id: m.joueur_b, page_id: m.page_b, soumis_le: m.soumis_b },
    ], { sansVote: 'premier' });
  } else if (pages.length === 1) {
    gagnant = pages[0] === 'a' ? m.joueur_a : m.joueur_b;
  } else {
    gagnant = m.joueur_a || m.joueur_b;
  }
  const fige = await sql`UPDATE tournoi_matchs SET gagnant = ${gagnant} WHERE id = ${m.id} AND gagnant IS NULL RETURNING id`;
  if (fige.length && pages.length) await accorderXP(gagnant, `victoire:match:${m.id}`, XP_TOURNOI.ronde);
}

async function avancerRonde(t) {
  const matchs = await sql`SELECT * FROM tournoi_matchs WHERE tournoi_id = ${t.id} AND ronde = ${t.ronde} ORDER BY ordre`;
  for (const m of matchs) if (!m.gagnant && new Date(m.soumission_fin) <= new Date()) await deciderMatch(m);
  const apres = await sql`SELECT ordre, gagnant FROM tournoi_matchs WHERE tournoi_id = ${t.id} AND ronde = ${t.ronde} ORDER BY ordre`;
  if (!apres.length || apres.some((m) => !m.gagnant)) return;

  if (apres.length === 1) {
    const gagnant = apres[0].gagnant;
    const fige = await sql`UPDATE tournois SET statut = 'termine', gagnant = ${gagnant}, termine_le = now() WHERE id = ${t.id} AND statut = 'en_cours' RETURNING id`;
    if (!fige.length) return;
    await accorderXP(gagnant, `victoire:tournoi:${t.id}`, XP_TOURNOI.victoire);
    const genre = GENRES_TOURNOI.find((g) => g.valeur === t.genre);
    await donnerRecompense(gagnant, {
      genre: 'insigne', detail: `${genre ? genre.label.toLowerCase() : ''} « ${t.titre} »`.trim(),
      source: `tournoi:${t.id}`, image: `insigne-${t.genre}.png`, xp: XP_TOURNOI.victoire, victoire: true,
    });
    return;
  }
  const suivante = await sql`UPDATE tournois SET ronde = ronde + 1 WHERE id = ${t.id} AND ronde = ${t.ronde} AND statut = 'en_cours' RETURNING ronde`;
  if (suivante.length) await creerRonde(t.id, suivante[0].ronde, apres.map((m) => m.gagnant));
}

export async function avancerTournois() {
  const fins = await sql`
    SELECT t.id, t.prolonge, (SELECT count(*)::int FROM tournoi_inscrits i WHERE i.tournoi_id = t.id) AS n
    FROM tournois t WHERE t.statut = 'inscriptions' AND t.inscriptions_fin <= now()`;
  for (const t of fins) {
    if (TOURNOIS.tailles.includes(t.n)) await demarrerTournoi(t.id);
    else if (t.n > TOURNOIS.tailles[0] && !t.prolonge) {
      await sql`UPDATE tournois SET prolonge = true, inscriptions_fin = inscriptions_fin + make_interval(days => ${TOURNOIS.joursInscription}) WHERE id = ${t.id}`;
    } else {
      await sql`UPDATE tournois SET statut = 'annule', termine_le = now() WHERE id = ${t.id} AND statut = 'inscriptions'`;
    }
  }
  const enCours = await sql`SELECT id, ronde, titre, genre FROM tournois WHERE statut = 'en_cours'`;
  for (const t of enCours) await avancerRonde(t);
}

export async function peutCreerTournoi() {
  const [actif] = await sql`SELECT 1 FROM tournois WHERE statut IN ('inscriptions', 'en_cours')`;
  if (actif) return { ok: false, raison: 'Un tournoi est déjà en cours' };
  const [ceMois] = await sql`
    SELECT 1 FROM tournois WHERE statut <> 'annule'
      AND date_trunc('month', cree_le AT TIME ZONE 'America/Toronto') = date_trunc('month', now() AT TIME ZONE 'America/Toronto')`;
  if (ceMois) return { ok: false, raison: 'Il y a déjà eu un tournoi ce mois-ci' };
  const [attente] = await sql`
    SELECT termine_le + make_interval(hours => ${TOURNOIS.heuresAttente}) AS possible_le FROM tournois
    WHERE termine_le > now() - make_interval(hours => ${TOURNOIS.heuresAttente}) ORDER BY termine_le DESC LIMIT 1`;
  if (attente) return { ok: false, raison: '72 h d’attente après la fin du dernier tournoi', possibleLe: attente.possible_le };
  return { ok: true };
}
