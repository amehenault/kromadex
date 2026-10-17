import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser, hashPassword, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Changer son courriel et/ou son mot de passe (mot de passe actuel exigé)
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const b = await req.json().catch(() => ({}));
    const actuel = String(b.actuel || '');
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');
    if (!email && !password) return NextResponse.json({ error: 'Rien à modifier.' }, { status: 400 });

    const [u] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
    if (!u || !verifyPassword(actuel, u.password_hash)) return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });

    if (email) {
      if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Courriel invalide.' }, { status: 400 });
      const pris = await sql`SELECT 1 FROM users WHERE email = ${email} AND id <> ${user.id}`;
      if (pris.length) return NextResponse.json({ error: 'Ce courriel est déjà utilisé.' }, { status: 409 });
      await sql`UPDATE users SET email = ${email} WHERE id = ${user.id}`;
    }
    if (password) {
      if (password.length < 8) return NextResponse.json({ error: 'Mot de passe : 8 caractères minimum.' }, { status: 400 });
      await sql`UPDATE users SET password_hash = ${hashPassword(password)} WHERE id = ${user.id}`;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/user/update :', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
