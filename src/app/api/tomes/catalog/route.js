import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Catalogue complet des tomes + ceux possédés par l'utilisatrice, avec sa progression
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const tomes = await sql`
      SELECT id, ean, nom, titre, type, editeur, collection, nb_pages, couverture, url
      FROM tome_catalog
      ORDER BY nom ASC
    `;
    // Progression automatique : numéros de page distincts enregistrés dans les fiches de ce tome
    const possedes = await sql`
      SELECT u.tome_id,
        (SELECT COUNT(DISTINCT p.page_no)::int FROM pages p
          WHERE p.user_id = ${user.id} AND lower(p.tome) = lower(c.nom) AND p.page_no ~ '^[0-9]+$' AND p.page_no::int > 0) AS faites
      FROM user_tomes u
      JOIN tome_catalog c ON c.id = u.tome_id
      WHERE u.user_id = ${String(user.id)}
    `;
    const progression = Object.fromEntries(possedes.map((p) => [Number(p.tome_id), { coloriees: p.faites }]));

    return NextResponse.json({ tomes, possedes: possedes.map((p) => Number(p.tome_id)), progression });
  } catch (err) {
    console.error('Erreur GET /api/tomes/catalog :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.', tomes: [], possedes: [], progression: {} }, { status: 500 });
  }
}

// Ajouter / retirer un tome de sa bibliothèque
export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { tomeId, action } = await req.json();
    const userIdStr = String(user.id);
    const id = Number(tomeId);
    if (!id) return NextResponse.json({ error: 'Tome invalide' }, { status: 400 });

    if (action === 'ADD') {
      // Ré-ajouter un tome le rend de nouveau visible dans le profil
      await sql.transaction([
        sql`INSERT INTO user_tomes (user_id, tome_id) VALUES (${userIdStr}, ${id}) ON CONFLICT DO NOTHING`,
        sql`DELETE FROM user_tomes_masques WHERE user_id = ${userIdStr}
            AND lower(nom) = (SELECT lower(nom) FROM tome_catalog WHERE id = ${id})`,
      ]);
    } else if (action === 'REMOVE') {
      await sql`
        DELETE FROM user_tomes WHERE user_id = ${userIdStr} AND tome_id = ${id}
      `;
    } else {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/tomes/catalog :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.' }, { status: 500 });
  }
}
