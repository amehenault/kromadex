import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';
import { gagnantVerdict } from '@/lib/verdicts';
import { donnerRecompense, donnerTitre } from '@/lib/recompensesServeur';
import { COMBATS, XP_COMBATS, VICTOIRES_EPEE, VICTOIRES_EXPERT_JOUTE, TITRE_EXPERT_JOUTE } from '@/lib/activites';

// Cycle d'un combat
//  duel  : invitation (5 jours pour accepter) -> soumission (12 jours après la création) -> verdict (5 jours) -> terminé
//  joute : ouvert (12 jours pour que les coloristes soumettent ; 2, 3 ou 4 places choisies à la création) -> verdict (5 jours) -> terminé
//  Un combat sans tous ses coloriages à temps est annulé.

async function terminer(c) {
  const source = `combat:${c.id}`;
  const entrees = await sql`SELECT user_id, page_id, soumis_le FROM combat_participants WHERE combat_id = ${c.id} AND page_id IS NOT NULL`;
  // Égalité ou aucun verdict : pas de gagnant
  const gagnant = await gagnantVerdict(source, entrees, { egalite: 'aucun' });
  const fige = await sql`UPDATE combats SET statut = 'termine', gagnant = ${gagnant} WHERE id = ${c.id} AND statut = 'verdict' RETURNING id`;
  if (!fige.length) return;
  const xp = XP_COMBATS[c.genre];
  for (const e of entrees) await accorderXP(e.user_id, `combat:${c.id}`, xp.participation);
  if (!gagnant) return;
  await accorderXP(gagnant, `victoire:${source}`, xp.victoire);

  const [{ n }] = await sql`SELECT count(*)::int AS n FROM combats WHERE genre = ${c.genre} AND gagnant = ${gagnant}`;
  if (c.genre === 'duel') {
    // Épée chromatique après 5 duels gagnés
    if (n >= VICTOIRES_EPEE) await donnerRecompense(gagnant, { genre: 'epee', source: 'duels' });
  } else {
    // Une joute (accessoire) par victoire ; 5 victoires débloquent le titre Expert de la joute
    await donnerRecompense(gagnant, { genre: 'joute', source });
    if (n >= VICTOIRES_EXPERT_JOUTE) await donnerTitre(gagnant, TITRE_EXPERT_JOUTE);
  }
}

// Fait avancer les combats selon le temps écoulé
export async function avancerCombats() {
  // Duel pas accepté dans les 5 jours : refusé
  await sql`UPDATE combats SET statut = 'refuse'
    WHERE statut = 'invitation' AND cree_le <= now() - make_interval(days => ${COMBATS.joursAcceptation})`;
  // Joute : à la date limite, le verdict commence s'il y a au moins 2 coloriages, sinon le combat est annulé
  await sql`
    UPDATE combats c SET statut = 'verdict', verdict_fin = now() + make_interval(days => ${COMBATS.joursVerdict})
    WHERE c.genre = 'joute' AND c.statut = 'ouvert' AND c.soumission_fin <= now()
      AND (SELECT count(*) FROM combat_participants p WHERE p.combat_id = c.id AND p.page_id IS NOT NULL) >= 2`;
  await sql`UPDATE combats SET statut = 'annule' WHERE statut IN ('ouvert', 'soumission') AND soumission_fin <= now()`;
  const finis = await sql`SELECT id, genre FROM combats WHERE statut = 'verdict' AND verdict_fin <= now()`;
  for (const c of finis) await terminer(c);
}

// Le verdict commence dès que tous les coloriages sont là (2 pour un duel, le nombre de places choisi pour une joute)
export async function verifierDepartVerdict(combatId) {
  await sql`
    UPDATE combats c SET statut = 'verdict', verdict_fin = now() + make_interval(days => ${COMBATS.joursVerdict})
    WHERE c.id = ${combatId} AND c.statut IN ('soumission', 'ouvert')
      AND (SELECT count(*) FROM combat_participants p WHERE p.combat_id = c.id AND p.page_id IS NOT NULL)
          >= CASE WHEN c.genre = 'duel' THEN 2 ELSE c.places END`;
}

// Deux personnes se suivent mutuellement
export async function seSuiventMutuellement(a, b) {
  const [r] = await sql`
    SELECT EXISTS (SELECT 1 FROM abonnements WHERE suiveur = ${a} AND suivi = ${b})
       AND EXISTS (SELECT 1 FROM abonnements WHERE suiveur = ${b} AND suivi = ${a}) AS ok`;
  return !!r?.ok;
}
