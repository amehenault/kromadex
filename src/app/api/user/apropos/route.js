import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { VALEURS_GENRES } from '@/lib/titres';
import { VALEURS_PAYS, PAYS_DEFAUT } from '@/lib/pays';

export const dynamic = 'force-dynamic';

// Pseudo, nom, biographie, genre (sert seulement à accorder le titre) et pays (sert au fuseau horaire)
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
  const pseudo = String(b.pseudo || '').trim().replace(/^@/, '').slice(0, 30);
  if (pseudo && !/^[\p{L}\p{N}._-]{2,30}$/u.test(pseudo)) {
    return NextResponse.json({ error: 'Le pseudo peut contenir lettres, chiffres, point, tiret et soulignement (2 à 30 caractères)' }, { status: 400 });
  }
  if (pseudo) {
    const [pris] = await sql`SELECT 1 FROM users WHERE lower(pseudo) = lower(${pseudo}) AND id <> ${user.id}`;
    if (pris) return NextResponse.json({ error: 'Ce pseudo est déjà pris' }, { status: 409 });
  }
  const genre = VALEURS_GENRES.includes(b.genre) ? b.genre : 'masculin';
  const pays = VALEURS_PAYS.includes(b.pays) ? b.pays : PAYS_DEFAUT;
  await sql`
    UPDATE users SET pseudo = ${pseudo || null}, name = ${String(b.name || '').trim().slice(0, 60) || null},
      bio = ${String(b.bio || '').trim().slice(0, 500)}, genre = ${genre}, pays = ${pays}
    WHERE id = ${user.id}`;
  return NextResponse.json({ ok: true });
}
