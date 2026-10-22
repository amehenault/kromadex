import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Le catalogue n'est visible qu'une fois connectée
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Récupération avec la colonne sub_type
    const allBrands = await sql`
      SELECT id, brand_name, range_name, COALESCE(sub_type, 'Autre') AS sub_type, created_by
      FROM marker_brands
      ORDER BY brand_name ASC, sub_type ASC, id ASC
    `;

    const userSetsRes = await sql`
      SELECT brand_id
      FROM user_sets
      WHERE user_id = ${String(user.id)}
    `;
    const userSets = userSetsRes.map((s) => Number(s.brand_id));

    return NextResponse.json({
      allBrands,
      userSets
    });
  } catch (err) {
    console.error('Erreur GET /api/markers :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.', allBrands: [], userSets: [] }, { status: 500 });
  }
}
