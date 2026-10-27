import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { calculerNiveau } from '@/lib/niveaux';
import { titreAffiche } from '@/lib/titres';
import { raisonsXP } from '@/lib/raisonsXP';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const [[u], lignes] = await Promise.all([
    sql`SELECT xp, title, genre FROM users WHERE id = ${user.id}`,
    sql`SELECT cle, xp FROM xp_journal WHERE user_id = ${user.id} AND NOT vu AND xp > 0 ORDER BY cree_le LIMIT 20`,
  ]);
  if (!u || !lignes.length) return NextResponse.json({ xp: 0, gains: [] });
  const raisons = await raisonsXP(user.id, lignes.map((l) => l.cle)).catch((e) => { console.error('Raisons des XP :', e.message); return {}; });
  const titre = titreAffiche(u.title, calculerNiveau(u.xp || 0), u.genre);
  return NextResponse.json({
    xp: lignes.reduce((t, l) => t + l.xp, 0),
    gains: lignes.map((l) => ({ xp: l.xp, raison: raisons[l.cle] || 'participé à une activité' })),
    titre,
    feminin: u.genre !== 'masculin',
  });
}

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await sql`UPDATE xp_journal SET vu = true WHERE user_id = ${user.id} AND NOT vu`;
  return NextResponse.json({ ok: true });
}
