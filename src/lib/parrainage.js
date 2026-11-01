import { randomBytes } from 'node:crypto';
import { sql } from '@/lib/db';
import { donnerRecompense } from '@/lib/recompensesServeur';

const LETTRES = 'abcdefghjkmnpqrstuvwxyz23456789';
const nouveauCode = () => [...randomBytes(8)].map((o) => LETTRES[o % LETTRES.length]).join('');
export const codeValide = (c) => /^[a-z0-9]{6,12}$/.test(String(c || ''));

export async function codeParrainage(userId) {
  const [u] = await sql`SELECT code_parrainage FROM users WHERE id = ${userId}`;
  if (u?.code_parrainage) return u.code_parrainage;
  for (let essai = 0; essai < 5; essai++) {
    try {
      const [r] = await sql`UPDATE users SET code_parrainage = ${nouveauCode()} WHERE id = ${userId} AND code_parrainage IS NULL RETURNING code_parrainage`;
      if (r) return r.code_parrainage;
      const [deja] = await sql`SELECT code_parrainage FROM users WHERE id = ${userId}`;
      return deja?.code_parrainage || null;
    } catch { /* code déjà pris : on réessaie */ }
  }
  return null;
}

export async function lierParrain(filleuleId, code) {
  if (!codeValide(code)) return;
  await sql`UPDATE users SET parrain = p.id FROM users p
    WHERE users.id = ${filleuleId} AND users.parrain IS NULL AND p.code_parrainage = ${code} AND p.id <> users.id`;
}

// La marraine est récompensée quand sa filleule publie son premier coloriage, pour éviter les faux comptes.
export async function verifierParrainage(filleuleId) {
  const [f] = await sql`
    SELECT u.parrain, u.pseudo FROM users u
    WHERE u.id = ${filleuleId} AND u.parrain IS NOT NULL
      AND EXISTS (SELECT 1 FROM pages p WHERE p.user_id = u.id AND p.publiee AND p.image_b64 IS NOT NULL)`;
  if (!f) return false;
  return donnerRecompense(f.parrain, { genre: 'parrainage', detail: f.pseudo ? `(@${f.pseudo})` : '', source: `parrainage:${filleuleId}` });
}

export async function filleules(userId) {
  return sql`
    SELECT u.id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           EXISTS (SELECT 1 FROM recompenses r WHERE r.user_id = ${userId} AND r.genre = 'parrainage' AND r.source = 'parrainage:' || u.id::text) AS validee
    FROM users u WHERE u.parrain = ${userId} ORDER BY u.created_at DESC`;
}
