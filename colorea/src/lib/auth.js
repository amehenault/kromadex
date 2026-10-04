import { cookies } from 'next/headers';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { sql } from './db';

const COOKIE = 'cm_session';
const sha = (t) => createHash('sha256').update(t).digest('hex');

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return salt.toString('hex') + ':' + scryptSync(pw, salt, 64).toString('hex');
}
export function verifyPassword(pw, stored) {
  const [s, h] = stored.split(':');
  return timingSafeEqual(scryptSync(pw, Buffer.from(s, 'hex'), 64), Buffer.from(h, 'hex'));
}
export async function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  await sql`insert into sessions (token_hash, user_id, expires_at) values (${sha(token)}, ${userId}, now() + interval '30 days')`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30,
  });
}
export async function getUser() {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  const r = await sql`select u.id, u.email from sessions s join users u on u.id = s.user_id where s.token_hash = ${sha(t)} and s.expires_at > now()`;
  return r[0] || null;
}
export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await sql`delete from sessions where token_hash = ${sha(t)}`;
  jar.delete(COOKIE);
}
