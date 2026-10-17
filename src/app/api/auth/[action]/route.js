import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth';
import { VALEURS_GENRES } from '@/lib/titres';
import { demanderReinitialisation, reinitialiser } from '@/lib/motDePasse';

const err = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function POST(req, { params }) {
  const { action } = await params;
  if (action === 'logout') { await destroySession(); return NextResponse.json({ ok: true }); }
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || '').trim().toLowerCase();
  const pw = String(b.password || '');
  if (action === 'register') {
    if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 8) return err('Courriel valide et mot de passe de 8 caractères minimum requis.', 400);
    try {
      const genre = VALEURS_GENRES.includes(b.genre) ? b.genre : 'masculin';
      const r = await sql`insert into users (email, password_hash, genre) values (${email}, ${hashPassword(pw)}, ${genre}) returning id`;
      await createSession(r[0].id);
      return NextResponse.json({ ok: true });
    } catch { return err('Ce courriel est déjà utilisé.', 409); }
  }
  if (action === 'login') {
    const r = await sql`select id, password_hash, suspendu_jusqu from users where email = ${email}`;
    if (!r.length || !verifyPassword(pw, r[0].password_hash)) return err('Courriel ou mot de passe incorrect.', 401);
    if (r[0].suspendu_jusqu && new Date(r[0].suspendu_jusqu) > new Date()) {
      const fin = new Date(r[0].suspendu_jusqu).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Toronto' });
      return err(`Ton compte est suspendu jusqu'au ${fin}.`, 403);
    }
    await createSession(r[0].id);
    return NextResponse.json({ ok: true });
  }
  // Mot de passe oublié : réponse identique que le compte existe ou non
  if (action === 'oubli') {
    if (/^\S+@\S+\.\S+$/.test(email)) await demanderReinitialisation(email, new URL(req.url).origin).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  if (action === 'reinitialiser') {
    const probleme = await reinitialiser(String(b.jeton || ''), pw);
    return probleme ? err(probleme, 400) : NextResponse.json({ ok: true });
  }
  return err('Action inconnue.', 404);
}
