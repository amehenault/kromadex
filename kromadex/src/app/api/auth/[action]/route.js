import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth';

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
      const r = await sql`insert into users (email, password_hash) values (${email}, ${hashPassword(pw)}) returning id`;
      await createSession(r[0].id);
      return NextResponse.json({ ok: true });
    } catch { return err('Ce courriel est déjà utilisé.', 409); }
  }
  if (action === 'login') {
    const r = await sql`select id, password_hash from users where email = ${email}`;
    if (!r.length || !verifyPassword(pw, r[0].password_hash)) return err('Courriel ou mot de passe incorrect.', 401);
    await createSession(r[0].id);
    return NextResponse.json({ ok: true });
  }
  return err('Action inconnue.', 404);
}
