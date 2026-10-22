import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Retirer un tome de son profil : le tome reste dans le catalogue et les fiches ne sont pas effacées
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const nom = String((await req.json()).nom || '').trim();
    if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    const uid = String(user.id);

    await sql.transaction([
      sql`DELETE FROM user_tomes WHERE user_id = ${uid}
          AND tome_id IN (SELECT id FROM tome_catalog WHERE lower(nom) = lower(${nom}))`,
      sql`INSERT INTO user_tomes_masques (user_id, nom) VALUES (${uid}, ${nom}) ON CONFLICT DO NOTHING`,
    ]);
    revalidatePath('/profil');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/tomes/delete :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.' }, { status: 500 });
  }
}
