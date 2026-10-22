import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { calculerNiveau } from '@/lib/niveaux';
import { titreNiveau } from '@/lib/titres';

export const dynamic = 'force-dynamic';

// XP gagnés pas encore montrés (pop-up « Bravo … tu as gagné … XP ! »), avec le titre de la personne :
// son titre spécial choisi dans Paramètres, sinon le titre de son niveau
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const [r] = await sql`
    SELECT COALESCE(sum(j.xp) FILTER (WHERE j.xp > 0), 0)::int AS xp, u.xp AS total, u.title, u.genre
    FROM users u LEFT JOIN xp_journal j ON j.user_id = u.id AND NOT j.vu
    WHERE u.id = ${user.id} GROUP BY u.id`;
  if (!r) return NextResponse.json({ xp: 0 });
  const titre = r.title && r.title !== 'Coloriste débutant' ? r.title : titreNiveau(calculerNiveau(r.total || 0), r.genre);
  return NextResponse.json({ xp: r.xp, titre, feminin: r.genre !== 'masculin' });
}

// Pop-up fermé : les gains sont marqués comme vus (les pénalités aussi, elles n'ont pas de pop-up)
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  await sql`UPDATE xp_journal SET vu = true WHERE user_id = ${user.id} AND NOT vu`;
  return NextResponse.json({ ok: true });
}
