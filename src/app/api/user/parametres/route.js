import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { typesPour } from '@/lib/typesNotifications';
import { cadresDebloques } from '@/lib/cadres';
import { MAX_EPINGLES } from '@/lib/recompenses';
import { titresNiveauAtteints } from '@/lib/titres';
import { calculerNiveau } from '@/lib/niveaux';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const [u] = await sql`SELECT role, pionnier, notifs, unlocked_titles, xp, genre,
      EXISTS (SELECT 1 FROM recompenses r WHERE r.user_id = users.id AND r.genre = 'relique') AS relique
    FROM users WHERE id = ${user.id}`;

  if (b.notifs && typeof b.notifs === 'object') {
    const permis = typesPour(u.role).map((t) => t.cle);
    const notifs = { ...(u.notifs || {}) };
    for (const [cle, v] of Object.entries(b.notifs)) if (permis.includes(cle)) notifs[cle] = v === true;
    await sql`UPDATE users SET notifs = ${JSON.stringify(notifs)}::jsonb WHERE id = ${user.id}`;
  }

  if ('cadre' in b) {
    const choix = b.cadre === 'aucun' ? 'aucun' : String(b.cadre || '');
    if (choix !== 'aucun' && !cadresDebloques(u).includes(choix)) {
      return NextResponse.json({ error: 'Ce cadre n’est pas encore débloqué' }, { status: 403 });
    }
    await sql`UPDATE users SET cadre = ${choix} WHERE id = ${user.id}`;
  }
  if ('badges' in b) {
    if (!Array.isArray(b.badges)) return NextResponse.json({ error: 'Liste invalide' }, { status: 400 });
    const badges = [...new Set(b.badges.filter((x) => typeof x === 'string' && x.length <= 200))].slice(0, MAX_EPINGLES);
    await sql`UPDATE users SET badges_epingles = ${JSON.stringify(badges)}::jsonb WHERE id = ${user.id}`;
  }
  if ('titre' in b) {
    const titre = String(b.titre || '');
    const permis = [...(u.unlocked_titles || []), ...titresNiveauAtteints(calculerNiveau(u.xp || 0), u.genre)];
    if (titre && !permis.includes(titre)) {
      return NextResponse.json({ error: 'Ce titre n’est pas encore débloqué' }, { status: 403 });
    }
    await sql`UPDATE users SET title = ${titre || null} WHERE id = ${user.id}`;
  }
  return NextResponse.json({ ok: true });
}
