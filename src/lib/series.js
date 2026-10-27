import { sql } from '@/lib/db';
import { addXP } from '@/lib/user';

export const FUSEAU = 'America/Toronto';

export const BONUS_SERIE = { coloriage: 300, connexion: 75 };

const jourMoins = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

export function serieEnCours(jours, aujourdhui) {
  const set = new Set(jours);
  let fin = set.has(aujourdhui) ? aujourdhui : set.has(jourMoins(aujourdhui, 1)) ? jourMoins(aujourdhui, 1) : null;
  if (!fin) return { longueur: 0, debut: null };
  let longueur = 0;
  while (set.has(jourMoins(fin, longueur))) longueur++;
  return { longueur, debut: jourMoins(fin, longueur - 1) };
}

export function meilleureSerie(jours) {
  const tries = [...new Set(jours)].sort();
  let meilleure = 0, actuelle = 0, precedent = null;
  for (const j of tries) {
    actuelle = precedent && jourMoins(j, 1) === precedent ? actuelle + 1 : 1;
    meilleure = Math.max(meilleure, actuelle);
    precedent = j;
  }
  return meilleure;
}

export async function aujourdhuiLocal() {
  const [{ j }] = await sql`SELECT to_char((now() AT TIME ZONE ${FUSEAU})::date, 'YYYY-MM-DD') AS j`;
  return j;
}

export async function joursColories(userId) {
  return (await sql`
    SELECT DISTINCT to_char((created_at AT TIME ZONE ${FUSEAU})::date, 'YYYY-MM-DD') AS j
    FROM pages WHERE user_id = ${userId}`).map((r) => r.j);
}

export async function joursConnectes(userId) {
  return (await sql`SELECT to_char(jour, 'YYYY-MM-DD') AS j FROM connexions WHERE user_id = ${userId}`).map((r) => r.j);
}

export async function accorderXP(userId, cle, xp) {
  const ok = await sql`INSERT INTO xp_journal (user_id, cle, xp) VALUES (${userId}, ${cle}, ${xp}) ON CONFLICT DO NOTHING RETURNING 1`;
  if (ok.length && xp > 0) await addXP(userId, xp);
  return ok.length > 0;
}

export async function retirerXP(userId, cle) {
  const [r] = await sql`DELETE FROM xp_journal WHERE user_id = ${userId} AND cle = ${cle} RETURNING xp`;
  if (r?.xp) await addXP(userId, -r.xp);
  return r?.xp || 0;
}

export async function penaliserXP(userId, cle, xp) {
  if (!(xp > 0)) return false;
  const ok = await sql`INSERT INTO xp_journal (user_id, cle, xp) VALUES (${userId}, ${cle}, ${-xp}) ON CONFLICT DO NOTHING RETURNING 1`;
  if (ok.length) await addXP(userId, -xp);
  return ok.length > 0;
}

export async function accorderSerie(userId, type) {
  const aujourdhui = await aujourdhuiLocal();
  const jours = type === 'coloriage' ? await joursColories(userId) : await joursConnectes(userId);
  const { longueur, debut } = serieEnCours(jours, aujourdhui);
  let gagne = 0;
  for (let k = 1; k <= Math.floor(longueur / 7); k++) {
    const cle = `serie-${type}:${debut}:${k}`;
    const ok = await sql`INSERT INTO xp_journal (user_id, cle, xp) VALUES (${userId}, ${cle}, ${BONUS_SERIE[type]})
      ON CONFLICT DO NOTHING RETURNING 1`;
    if (ok.length) { await addXP(userId, BONUS_SERIE[type]); gagne += BONUS_SERIE[type]; }
  }
  return gagne;
}

export async function noterConnexion(userId) {
  const nouveau = await sql`
    INSERT INTO connexions (user_id, jour) VALUES (${userId}, (now() AT TIME ZONE ${FUSEAU})::date)
    ON CONFLICT DO NOTHING RETURNING 1`;
  if (nouveau.length) await accorderSerie(userId, 'connexion');
}
