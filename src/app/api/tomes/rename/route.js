import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const b = await req.json();
    const ancien = String(b.ancienNom || '').trim();
    const nouveau = String(b.nouveauNom || ancien).trim().slice(0, 60);
    const nbPages = b.nbPages === '' || b.nbPages == null ? null : Math.max(1, Math.min(2000, parseInt(b.nbPages, 10) || 0)) || null;
    if (!ancien || !nouveau) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

    const auCatalogue = await sql`SELECT 1 FROM tome_catalog WHERE lower(nom) = lower(${ancien}) OR lower(nom) = lower(${nouveau}) LIMIT 1`;
    if (auCatalogue.length) return NextResponse.json({ error: 'Les tomes du catalogue ne peuvent pas être renommés.' }, { status: 400 });

    const uid = String(user.id);
    await sql.transaction([
      sql`UPDATE pages SET tome = ${nouveau} WHERE user_id = ${user.id} AND tome = ${ancien}`,
      sql`UPDATE tome_covers SET tome_name = ${nouveau} WHERE user_id = ${uid} AND tome_name = ${ancien}`,
      sql`DELETE FROM tomes_perso WHERE user_id = ${uid} AND nom = ${ancien}`,
      sql`INSERT INTO tomes_perso (user_id, nom, nb_pages) VALUES (${uid}, ${nouveau}, ${nbPages})
          ON CONFLICT (user_id, nom) DO UPDATE SET nb_pages = ${nbPages}`,
    ]);
    revalidatePath('/profil');
    return NextResponse.json({ success: true, nom: nouveau });
  } catch (err) {
    console.error('Erreur POST /api/tomes/rename :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.' }, { status: 500 });
  }
}
