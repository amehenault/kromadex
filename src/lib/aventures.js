import { sql } from '@/lib/db';
import { accorderXP } from '@/lib/series';
import { donnerRecompense, utiliserParchemin, rendreParchemin } from '@/lib/recompensesServeur';
import { pageConvient } from '@/lib/defis';
import { jourQuebec } from '@/lib/temps';
import { XP_EPOPEE, XP_PROPHETIE, PALIERS_BOUSSOLE } from '@/lib/activites';

// Expéditions, épopées et prophéties.
//  Expédition : un seul coloriage, une contrainte obligatoire et des contraintes secondaires ;
//               réussie si l'obligatoire et au moins une secondaire sont respectées. Pas de verdict.
//  Épopée : phase 1, une énigme révèle les contraintes du premier coloriage ; il faut 6 contributions
//           de 6 personnes pour ouvrir la route. Phase 2, chaque contrainte respectée retire des points
//           de résistance au dragon (une attaque par jour et par personne).
//  Prophétie : des étapes d'une semaine, révélées au fil du mois.
// Le Parchemin du Destin élimine une contrainte obligatoire.

const xpDe = (a, cle, defaut) => (Number.isFinite(Number(a.xp?.[cle])) ? Number(a.xp[cle]) : defaut);
export const normaliser = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export async function chargerAventure(id) {
  const [a] = await sql`
    SELECT *, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin,
           (((fin + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin_instant
    FROM aventures WHERE id = ${Number(id)}`;
  if (!a) return null;
  const etapes = await sql`
    SELECT id, ordre, nom, instructions, xp, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin
    FROM aventure_etapes WHERE aventure_id = ${a.id} ORDER BY ordre`;
  const contraintes = etapes.length
    ? await sql`SELECT id, etape_id, ordre, texte, genre, degats, xp FROM aventure_contraintes WHERE etape_id = ANY(${etapes.map((e) => e.id)}) ORDER BY ordre, id`
    : [];
  for (const e of etapes) e.contraintes = contraintes.filter((c) => c.etape_id === e.id);
  return { ...a, etapes };
}

// Progression de l'épopée : contributions de la phase 1, attaques et dégâts de la phase 2
export async function etatEpopee(a) {
  const [p1, p2] = a.etapes;
  const [r] = await sql`
    SELECT (SELECT count(DISTINCT user_id)::int FROM aventure_soumissions WHERE aventure_id = ${a.id} AND etape_id = ${p1?.id || 0} AND reussie) AS contributions,
           (SELECT count(*)::int FROM aventure_soumissions WHERE aventure_id = ${a.id} AND etape_id = ${p2?.id || 0} AND reussie) AS attaques,
           (SELECT COALESCE(sum(degats), 0)::int FROM aventure_soumissions WHERE aventure_id = ${a.id} AND etape_id = ${p2?.id || 0} AND reussie) AS degats`;
  return {
    ...r,
    routeOuverte: r.contributions >= a.min_contributions,
    pvRestants: Math.max(0, a.pv - r.degats),
    vaincu: !!a.victoire_le,
  };
}

// Boussole : un nouveau niveau à la 1re, 3e, 5e, 7e et 9e expédition réussie (voir PALIERS_BOUSSOLE)
async function verifierBoussole(userId) {
  const [{ n }] = await sql`
    SELECT count(DISTINCT s.aventure_id)::int AS n FROM aventure_soumissions s JOIN aventures a ON a.id = s.aventure_id
    WHERE s.user_id = ${userId} AND s.reussie AND a.genre = 'expedition'`;
  for (const [i, palier] of PALIERS_BOUSSOLE.entries()) {
    if (n < palier) break;
    await donnerRecompense(userId, {
      genre: 'boussole', detail: `niveau ${i + 1} (${palier} expédition${palier > 1 ? 's' : ''})`, source: `boussole:${palier}`, image: `level${i + 1}`,
    });
  }
}

// Épopée gagnée : 200 XP et le blason pour chaque personne qui a contribué à une des deux phases
async function verifierVictoireEpopee(a) {
  const etat = await etatEpopee(a);
  if (a.victoire_le || etat.attaques < a.min_attaques || etat.pvRestants > 0) return false;
  const fige = await sql`UPDATE aventures SET victoire_le = now() WHERE id = ${a.id} AND victoire_le IS NULL RETURNING id`;
  if (!fige.length) return false;
  const contributeurs = await sql`SELECT DISTINCT user_id FROM aventure_soumissions WHERE aventure_id = ${a.id} AND reussie`;
  const xp = Math.min(xpDe(a, 'victoire', XP_EPOPEE.victoire), xpDe(a, 'max', XP_EPOPEE.max));
  for (const c of contributeurs) {
    // Plafond par personne et par épopée
    const [{ deja }] = await sql`SELECT COALESCE(sum(xp), 0)::int AS deja FROM xp_journal WHERE user_id = ${c.user_id} AND cle LIKE ${`aventure:${a.id}:%`}`;
    const reste = Math.max(0, Math.min(xp, xpDe(a, 'max', XP_EPOPEE.max) - deja));
    if (reste) await accorderXP(c.user_id, `aventure:${a.id}:victoire`, reste);
    await donnerRecompense(c.user_id, { genre: 'blason', detail: a.recompense ? `« ${a.recompense} »` : `« ${a.titre} »`, source: `aventure:${a.id}`, image: a.image });
  }
  return true;
}

// Soumettre un coloriage à une étape. contraintes : ids des contraintes respectées ;
// parchemin : id d'une contrainte obligatoire éliminée avec un Parchemin du Destin.
export async function soumettre(a, userId, { etapeId, pageId, contraintes = [], parchemin = null }) {
  const aujourdhui = jourQuebec();
  if (a.debut > aujourdhui) return { erreur: 'Cette aventure n’a pas encore commencé' };
  if (a.fin < aujourdhui) return { erreur: 'Cette aventure est terminée' };
  const etape = a.etapes.find((e) => e.id === Number(etapeId));
  if (!etape) return { erreur: 'Étape introuvable' };
  if (etape.debut && etape.debut > aujourdhui) return { erreur: 'Cette étape n’est pas encore révélée' };
  if (etape.fin && etape.fin < aujourdhui) return { erreur: 'Cette étape est terminée' };

  // Le coloriage vient de la section Tomes / Livres, du bon type, et ne sert qu'une fois par aventure
  const [p] = await sql`SELECT id, COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') AS type_coloriage, tome FROM pages WHERE id = ${pageId} AND user_id = ${userId} AND image_b64 IS NOT NULL`;
  if (!p) return { erreur: 'Coloriage introuvable' };
  if (!p.tome) return { erreur: 'Le coloriage doit venir de ta section Tomes / Livres' };
  if (!pageConvient(a.categorie, p.type_coloriage)) return { erreur: 'Ce coloriage n’est pas du bon type' };
  const [dejaPage] = await sql`SELECT 1 FROM aventure_soumissions WHERE aventure_id = ${a.id} AND page_id = ${p.id}`;
  if (dejaPage) return { erreur: 'Ce coloriage a déjà servi dans cette aventure' };

  const ids = new Set(etape.contraintes.map((c) => c.id));
  const choisies = [...new Set((contraintes || []).map(Number))].filter((id) => ids.has(id));
  const obligatoires = etape.contraintes.filter((c) => c.genre === 'obligatoire');
  const secondaires = etape.contraintes.filter((c) => c.genre === 'secondaire');
  const elimine = parchemin ? obligatoires.find((c) => c.id === Number(parchemin)) : null;
  if (parchemin && !elimine) return { erreur: 'Le parchemin ne peut éliminer qu’une contrainte obligatoire' };
  const manquantes = obligatoires.filter((c) => !choisies.includes(c.id) && c.id !== elimine?.id);

  let degats = 0;
  const mesSoumissions = await sql`SELECT etape_id, to_char(jour, 'YYYY-MM-DD') AS jour FROM aventure_soumissions WHERE aventure_id = ${a.id} AND user_id = ${userId}`;

  if (a.genre === 'expedition') {
    if (mesSoumissions.length) return { erreur: 'Une seule soumission est permise par expédition' };
    if (manquantes.length) return { erreur: 'La contrainte obligatoire doit être respectée' };
    if (secondaires.length && !choisies.some((id) => secondaires.some((s) => s.id === id))) return { erreur: 'Respecte au moins une contrainte secondaire' };
  } else if (a.genre === 'prophetie') {
    if (mesSoumissions.some((s) => s.etape_id === etape.id)) return { erreur: 'Tu as déjà accompli cette étape' };
    if (manquantes.length) return { erreur: 'Toutes les contraintes de l’étape doivent être respectées' };
  } else {
    const [inscription] = await sql`SELECT enigme_ok FROM aventure_inscriptions WHERE aventure_id = ${a.id} AND user_id = ${userId}`;
    if (!inscription) return { erreur: 'Inscris-toi d’abord à l’épopée' };
    if (a.victoire_le) return { erreur: 'Le dragon est déjà vaincu' };
    if (etape.ordre === 1) {
      if (!inscription.enigme_ok) return { erreur: 'Résous d’abord l’énigme' };
      if (mesSoumissions.some((s) => s.etape_id === etape.id)) return { erreur: 'Une seule contribution par personne pour ouvrir la route' };
      if (manquantes.length) return { erreur: 'Toutes les contraintes doivent être respectées' };
    } else {
      if (!(await etatEpopee(a)).routeOuverte) return { erreur: 'La route vers le dragon n’est pas encore ouverte' };
      if (mesSoumissions.some((s) => s.etape_id === etape.id && s.jour === aujourdhui)) return { erreur: 'Une seule attaque par jour : reviens demain' };
      degats = etape.contraintes.filter((c) => choisies.includes(c.id)).reduce((s, c) => s + (c.degats || 0), 0);
      if (!degats) return { erreur: 'Ton coloriage doit toucher au moins un point faible du dragon' };
    }
  }

  if (elimine && !(await utiliserParchemin(userId))) return { erreur: 'Tu n’as plus de Parchemin du Destin' };
  const cree = await sql`
    INSERT INTO aventure_soumissions (aventure_id, etape_id, user_id, page_id, contraintes, parchemin, degats, reussie, jour)
    VALUES (${a.id}, ${etape.id}, ${userId}, ${p.id}, ${choisies}, ${elimine?.id || null}, ${degats}, true, ${aujourdhui})
    ON CONFLICT DO NOTHING RETURNING id`;
  if (!cree.length) {
    if (elimine) await rendreParchemin(userId);
    return { erreur: 'Ce coloriage a déjà servi dans cette aventure' };
  }

  // XP et récompenses
  let xp = 0;
  const gagner = async (cle, montant) => { if (montant > 0 && (await accorderXP(userId, cle, montant))) xp += montant; };
  if (a.genre === 'expedition') {
    await gagner(`aventure:${a.id}:base`, etape.xp);
    for (const s of secondaires) if (choisies.includes(s.id)) await gagner(`aventure:${a.id}:c:${s.id}`, s.xp);
    await verifierBoussole(userId);
  } else if (a.genre === 'prophetie') {
    await gagner(`aventure:${a.id}:etape:${etape.id}`, etape.xp || xpDe(a, 'etape', XP_PROPHETIE.etape));
    const [{ faites }] = await sql`SELECT count(DISTINCT etape_id)::int AS faites FROM aventure_soumissions WHERE aventure_id = ${a.id} AND user_id = ${userId} AND reussie`;
    if (faites >= a.etapes.length) {
      await gagner(`aventure:${a.id}:complet`, xpDe(a, 'complet', XP_PROPHETIE.complet));
      await donnerRecompense(userId, { genre: 'orbe', detail: `« ${a.titre} »`, source: `aventure:${a.id}`, image: a.image });
      await donnerRecompense(userId, { genre: 'parchemin', source: `aventure:${a.id}` });
    }
  } else if (etape.ordre === 1) {
    await gagner(`aventure:${a.id}:phase1`, xpDe(a, 'phase1', XP_EPOPEE.phase1));
  } else {
    await gagner(`aventure:${a.id}:attaque`, xpDe(a, 'attaque', XP_EPOPEE.attaque));
    await verifierVictoireEpopee(await chargerAventure(a.id));
  }
  return { ok: true, xp, degats };
}

// Énigme de l'épopée : la bonne réponse révèle les contraintes de la phase 1
export async function repondreEnigme(a, userId, reponse) {
  const [inscription] = await sql`SELECT enigme_ok FROM aventure_inscriptions WHERE aventure_id = ${a.id} AND user_id = ${userId}`;
  if (!inscription) return { erreur: 'Inscris-toi d’abord à l’épopée' };
  if (inscription.enigme_ok) return { ok: true };
  const bonnes = String(a.reponse || '').split('|').map(normaliser).filter(Boolean);
  if (!bonnes.includes(normaliser(reponse))) return { erreur: 'Ce n’est pas la bonne réponse. Essaie encore !' };
  await sql`UPDATE aventure_inscriptions SET enigme_ok = true WHERE aventure_id = ${a.id} AND user_id = ${userId}`;
  return { ok: true };
}
