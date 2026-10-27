import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { VALEURS_GENRES } from '@/lib/titres';
import { VALEURS_PAYS, PAYS_DEFAUT } from '@/lib/pays';
import { nettoyerPseudo, erreurPseudo, pseudoPris, estDoublon, MESSAGE_PRIS } from '@/lib/pseudo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const [r] = await sql`SELECT pseudo, name, bio, genre, pays FROM users WHERE id = ${user.id}`;
  return NextResponse.json({ pseudo: r?.pseudo || '', name: r?.name || '', bio: r?.bio || '', genre: r?.genre || 'masculin', pays: r?.pays || PAYS_DEFAUT });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const pseudo = nettoyerPseudo(b.pseudo);
  if (pseudo && erreurPseudo(pseudo)) return NextResponse.json({ error: erreurPseudo(pseudo) }, { status: 400 });
  if (pseudo && await pseudoPris(pseudo, user.id)) return NextResponse.json({ error: MESSAGE_PRIS }, { status: 409 });
  const genre = VALEURS_GENRES.includes(b.genre) ? b.genre : 'masculin';
  const pays = VALEURS_PAYS.includes(b.pays) ? b.pays : PAYS_DEFAUT;
  try {
    await sql`
      UPDATE users SET pseudo = ${pseudo || null}, name = ${String(b.name || '').trim().slice(0, 60) || null},
        bio = ${String(b.bio || '').trim().slice(0, 500)}, genre = ${genre}, pays = ${pays}
      WHERE id = ${user.id}`;
  } catch (e) {
    if (estDoublon(e)) return NextResponse.json({ error: MESSAGE_PRIS }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
