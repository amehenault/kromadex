import { sql } from '@/lib/db';

export const nettoyerPseudo = (v) => String(v || '').trim().replace(/^@/, '').slice(0, 30);

export function erreurPseudo(pseudo) {
  if (!/^[\p{L}\p{N}._-]{2,30}$/u.test(pseudo)) {
    return 'Le pseudo peut contenir lettres, chiffres, point, tiret et soulignement (2 à 30 caractères)';
  }
  return null;
}

export async function pseudoPris(pseudo, userId) {
  const [pris] = userId
    ? await sql`SELECT 1 FROM users WHERE lower(pseudo) = lower(${pseudo}) AND id <> ${userId}`
    : await sql`SELECT 1 FROM users WHERE lower(pseudo) = lower(${pseudo})`;
  return Boolean(pris);
}

export const estDoublon = (e) => e?.code === '23505';
export const MESSAGE_PRIS = 'Ce pseudo est déjà pris';
