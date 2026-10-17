import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';
import { gagnantVerdict } from '@/lib/verdicts';
import { donnerRecompense, donnerTitre, recompenserVictoire } from '@/lib/recompensesServeur';
import { LIGNES_BINGO, NB_CASES } from '@/lib/bingos';
import { XP_EPREUVES, XP_GROUPE, FRAGMENTS_PAR_RELIQUE, XP_RELIQUE, XP_BINGO } from '@/lib/activites';

// Clôture des épreuves et des bingos, faite au besoin quand on consulte les activités.
// Une épreuve dure un mois moins un jour : le verdict se termine la veille du dernier jour du mois
// et les gagnant·es sont annoncé·es le dernier jour.

const TITRE_CHEFFE = 'Chef·fe des coloristes';

// Reliques : chaque groupe de 4 fragments complète une relique (cadre de profil exclusif et 400 XP)
async function verifierReliques(userId) {
  const [{ fragments, reliques }] = await sql`
    SELECT count(*) FILTER (WHERE genre = 'fragment')::int AS fragments, count(*) FILTER (WHERE genre = 'relique')::int AS reliques
    FROM recompenses WHERE user_id = ${userId}`;
  for (let k = reliques + 1; k <= Math.floor(fragments / FRAGMENTS_PAR_RELIQUE); k++) {
    if (await donnerRecompense(userId, { genre: 'relique', source: `relique:${k}`, xp: XP_RELIQUE })) {
      await accorderXP(userId, `relique:${k}`, XP_RELIQUE);
    }
  }
}

// La personne qui gagne l'épreuve du mois devient Chef·fe des coloristes pour un mois
async function nommerCheffe(userId) {
  const maj = await sql`
    UPDATE users SET role = 'cheffe', cheffe_depuis = now(), cheffe_expires_at = now() + interval '1 month'
    WHERE id = ${userId} AND role IN ('coloriste', 'cheffe') RETURNING id`;
  if (maj.length) await donnerTitre(userId, TITRE_CHEFFE);
}

async function cloturerEpreuve(d) {
  const source = `epreuve:${d.id}`;
  const entrees = await sql`
    SELECT user_id, page_id, cree_le AS soumis_le FROM defi_participations
    WHERE defi_id = ${d.id} AND page_id IS NOT NULL`;
  const gagnant = await gagnantVerdict(source, entrees);
  const fige = await sql`UPDATE defis SET cloture = true, gagnant = ${gagnant} WHERE id = ${d.id} AND NOT cloture RETURNING id`;
  if (!fige.length || !gagnant) return;

  const xp = XP_EPREUVES[d.genre].victoire;
  const nom = `« ${d.titre} »`;
  if (d.genre === 'officiel') {
    await recompenserVictoire(gagnant, { cleXP: `victoire:${source}`, xp, genre: 'coffre', detail: `de ${nom}`, source });
    await donnerRecompense(gagnant, { genre: 'badge_epreuve', detail: nom, source, image: d.image });
    await nommerCheffe(gagnant);
  } else if (d.genre === 'modo') {
    await recompenserVictoire(gagnant, { cleXP: `victoire:${source}`, xp, genre: 'badge_sentinelle', detail: nom, source, image: d.image });
    await donnerRecompense(gagnant, { genre: 'fragment', source });
    await verifierReliques(gagnant);
  } else if (d.genre === 'cheffe') {
    const [chef] = await sql`SELECT pseudo, name FROM users WHERE id = ${d.choisi_par}`;
    const auteur = chef?.pseudo ? `@${chef.pseudo}` : chef?.name || 'la cheffe';
    await recompenserVictoire(gagnant, {
      cleXP: `victoire:${source}`, xp, genre: 'sceau', detail: `de ${auteur}`, source, image: `sceau-${d.sceau || 1}.png`,
    });
  }
  // Titre exclusif créé par la personne qui a lancé l'épreuve
  if (d.titre_gagnant) await donnerTitre(gagnant, d.titre_gagnant);
}

// Épreuve de groupe : 150 XP chacun si l'objectif est atteint, sinon 10 XP ; 5 XP par coloriage supplémentaire
async function cloturerGroupe(d) {
  const fige = await sql`UPDATE defis SET cloture = true WHERE id = ${d.id} AND NOT cloture RETURNING id`;
  if (!fige.length) return;
  const envois = await sql`SELECT user_id, count(*)::int AS n FROM defi_envois WHERE defi_id = ${d.id} GROUP BY user_id`;
  const total = envois.reduce((s, e) => s + e.n, 0);
  const complete = d.objectif > 0 && total >= d.objectif;
  for (const e of envois) {
    await accorderXP(e.user_id, `groupe:${d.id}`, complete ? XP_GROUPE.complete : XP_GROUPE.participation);
    if (d.multiple && e.n > 1) await accorderXP(e.user_id, `groupe:${d.id}:supp`, (e.n - 1) * XP_GROUPE.supplementaire);
  }
}

export async function cloturerEpreuves() {
  const finies = await sql`
    SELECT id, genre, titre, titre_gagnant, image, sceau, objectif, multiple, choisi_par FROM defis
    WHERE NOT cloture AND fin < (now() AT TIME ZONE 'America/Toronto')::date`;
  for (const d of finies) {
    if (d.genre === 'groupe') await cloturerGroupe(d);
    else await cloturerEpreuve(d);
  }
}

// XP d'un bingo pour une personne, d'après ses cases validées (versés une seule fois chacun)
export async function recompenserBingo(bingoId, userId) {
  const cases = await sql`SELECT case_no, page_id FROM bingo_cases WHERE bingo_id = ${bingoId} AND user_id = ${userId} AND valide AND page_id IS NOT NULL`;
  const faites = new Set(cases.map((c) => c.case_no));
  const lignes = LIGNES_BINGO.filter((l) => l.every((i) => faites.has(i))).length;
  for (let k = 1; k <= Math.min(lignes, XP_BINGO.lignesMax); k++) await accorderXP(userId, `bingo:${bingoId}:ligne:${k}`, XP_BINGO.ligne);
  if (faites.size >= NB_CASES) await accorderXP(userId, `bingo:${bingoId}:grille`, XP_BINGO.grille);
  // Un même coloriage qui remplit plusieurs cases
  const parPage = {};
  for (const c of cases) parPage[c.page_id] = (parPage[c.page_id] || 0) + 1;
  for (const [page, n] of Object.entries(parPage)) {
    for (let j = 2; j <= n; j++) await accorderXP(userId, `bingo:${bingoId}:page:${page}:${j}`, XP_BINGO.caseEnPlus);
    if (n >= NB_CASES) await accorderXP(userId, `bingo:${bingoId}:tout:${page}`, XP_BINGO.toutEnUn);
  }
}

// Bingo terminé (le dernier jour du mois) : les XP des cases déjà validées sont versés.
// Les cases validées plus tard sont récompensées au moment de leur validation.
export async function bingoTermine(bingoId) {
  const [b] = await sql`
    SELECT COALESCE(fin, (date_trunc('month', debut) + interval '1 month - 2 days')::date) < (now() AT TIME ZONE 'America/Toronto')::date AS fini
    FROM bingos WHERE id = ${bingoId}`;
  return !!b?.fini;
}

export async function cloturerBingos() {
  const finis = await sql`
    UPDATE bingos SET cloture = true
    WHERE NOT cloture AND COALESCE(fin, (date_trunc('month', debut) + interval '1 month - 2 days')::date) < (now() AT TIME ZONE 'America/Toronto')::date
    RETURNING id`;
  for (const b of finis) {
    const personnes = await sql`SELECT DISTINCT user_id FROM bingo_cases WHERE bingo_id = ${b.id} AND valide`;
    for (const p of personnes) await recompenserBingo(b.id, p.user_id);
  }
}
