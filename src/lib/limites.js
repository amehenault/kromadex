import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export const LIMITES = {
  paire: { max: 5, minutes: 15 },
  ip: { max: 30, minutes: 15 },
  compte: { max: 50, minutes: 60 },
  inscription: { max: 10, minutes: 60 },
  oubli: { max: 10, minutes: 60 },
};

const COOKIE_APPAREIL = 'cm_appareil';
const empreinte = (t) => createHash('sha256').update(String(t)).digest('hex');

export function ipDe(req) {
  const ip = req.headers.get('x-real-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0];
  return (ip || 'inconnue').trim().slice(0, 64);
}

const fenetre = (minutes) => `${minutes} minutes`;

async function noter(genre, ip, email = '') {
  const ipH = empreinte(ip), emailH = email ? empreinte(email.toLowerCase()) : '';
  await sql`INSERT INTO essais_limites (genre, ip_h, email_h) VALUES (${genre}, ${ipH}, ${emailH})`;
  return { ipH, emailH };
}

export async function limiteParIp(genre, req) {
  const { max, minutes } = LIMITES[genre];
  const { ipH } = await noter(genre, ipDe(req));
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM essais_limites
    WHERE genre = ${genre} AND ip_h = ${ipH} AND cree_le > now() - ${fenetre(minutes)}::interval`;
  return n > max;
}

export async function essaiConnexion(req, email) {
  const { ipH, emailH } = await noter('connexion', ipDe(req), email);
  const [c] = await sql`SELECT
      count(*) FILTER (WHERE ip_h = ${ipH} AND email_h = ${emailH} AND cree_le > now() - ${fenetre(LIMITES.paire.minutes)}::interval)::int AS paire,
      count(*) FILTER (WHERE ip_h = ${ipH} AND cree_le > now() - ${fenetre(LIMITES.ip.minutes)}::interval)::int AS ip,
      count(*) FILTER (WHERE email_h = ${emailH} AND cree_le > now() - ${fenetre(LIMITES.compte.minutes)}::interval)::int AS compte
    FROM essais_limites WHERE genre = 'connexion' AND (ip_h = ${ipH} OR email_h = ${emailH})`;
  await sql`DELETE FROM essais_limites WHERE cree_le < now() - interval '2 days'`;
  return {
    ipH, emailH,
    bloque: c.paire > LIMITES.paire.max || c.ip > LIMITES.ip.max,
    compteSature: c.compte > LIMITES.compte.max,
  };
}

export async function connexionReussie({ ipH, emailH }) {
  await sql`DELETE FROM essais_limites WHERE genre = 'connexion' AND ip_h = ${ipH} AND email_h = ${emailH}`;
}

export async function appareilConnu(userId) {
  const jeton = (await cookies()).get(COOKIE_APPAREIL)?.value;
  if (!jeton || !/^[0-9a-f]{64}$/.test(jeton)) return false;
  const [r] = await sql`SELECT 1 FROM appareils_connus WHERE jeton_hash = ${empreinte(jeton)} AND user_id = ${userId}`;
  return Boolean(r);
}

export async function retenirAppareil(userId) {
  if (await appareilConnu(userId)) return;
  const jeton = randomBytes(32).toString('hex');
  await sql`INSERT INTO appareils_connus (jeton_hash, user_id) VALUES (${empreinte(jeton)}, ${userId}) ON CONFLICT DO NOTHING`;
  (await cookies()).set(COOKIE_APPAREIL, jeton, {
    httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365,
  });
}
