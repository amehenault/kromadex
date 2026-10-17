import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { typesPour } from '@/lib/typesNotifications';
import { cadresDebloques } from '@/lib/cadres';

export const dynamic = 'force-dynamic';

// Paramètres : notifications voulues par type ({ notifs: { missives: false, … } }), cadre de profil ({ cadre })
// et titre affiché ({ titre } parmi les titres débloqués, '' = aucun)
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const [u] = await sql`SELECT role, pionnier, notifs, unlocked_titles,
      EXISTS (SELECT 1 FROM recompenses r WHERE r.user_id = users.id AND r.genre = 'relique') AS relique
    FROM users WHERE id = ${user.id}`;

  if (b.notifs && typeof b.notifs === 'object') {
    // Seulement les types proposés à son poste, en vrai ou faux
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
  if ('titre' in b) {
    const titre = String(b.titre || '');
    if (titre && !(u.unlocked_titles || []).includes(titre)) {
      return NextResponse.json({ error: 'Ce titre n’est pas encore débloqué' }, { status: 403 });
    }
    await sql`UPDATE users SET title = ${titre || null} WHERE id = ${user.id}`;
  }
  return NextResponse.json({ ok: true });
}
