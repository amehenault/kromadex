import { sql } from '@/lib/db';
import { cloturerEpreuves } from '@/lib/clotures';
import { avancerCombats } from '@/lib/combats';
import { avancerTournois } from '@/lib/tournois';

export async function verdictsARendre(userId) {
  await Promise.all([cloturerEpreuves(), avancerCombats(), avancerTournois()]);
  const [epreuves, combats, matchs] = await Promise.all([
    sql`SELECT 'epreuve:' || d.id AS activite, 'epreuve' AS genre, d.titre, d.genre AS sorte,
          (((d.fin + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin,
          EXISTS (SELECT 1 FROM verdicts v WHERE v.activite = 'epreuve:' || d.id AND v.user_id = ${userId}) AS votee
        FROM defis d
        WHERE d.genre IN ('officiel', 'modo', 'cheffe', 'menestrel') AND NOT d.cloture
          AND d.debut <= (now() AT TIME ZONE 'America/Toronto')::date AND d.fin >= (now() AT TIME ZONE 'America/Toronto')::date
          AND EXISTS (SELECT 1 FROM defi_participations dp WHERE dp.defi_id = d.id AND dp.page_id IS NOT NULL AND dp.user_id <> ${userId})`,
    sql`SELECT 'combat:' || c.id AS activite, 'combat' AS genre, c.theme AS titre, c.genre AS sorte, c.verdict_fin AS fin,
          EXISTS (SELECT 1 FROM verdicts v WHERE v.activite = 'combat:' || c.id AND v.user_id = ${userId}) AS votee
        FROM combats c
        WHERE c.statut = 'verdict' AND c.verdict_fin > now()
          AND NOT EXISTS (SELECT 1 FROM combat_participants p WHERE p.combat_id = c.id AND p.user_id = ${userId})`,
    sql`SELECT 'match:' || m.id AS activite, 'match' AS genre, t.titre, 'ronde ' || m.ronde AS sorte, m.verdict_fin AS fin,
          EXISTS (SELECT 1 FROM verdicts v WHERE v.activite = 'match:' || m.id AND v.user_id = ${userId}) AS votee
        FROM tournoi_matchs m JOIN tournois t ON t.id = m.tournoi_id
        WHERE m.soumission_fin <= now() AND m.verdict_fin > now() AND m.gagnant IS NULL
          AND m.page_a IS NOT NULL AND m.page_b IS NOT NULL
          AND ${userId} NOT IN (COALESCE(m.joueur_a, '00000000-0000-0000-0000-000000000000'), COALESCE(m.joueur_b, '00000000-0000-0000-0000-000000000000'))`,
  ]);
  return [...epreuves, ...combats, ...matchs].sort((a, b) => new Date(a.fin) - new Date(b.fin));
}
