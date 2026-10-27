import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { brandId, action, customBrandName, customRangeName } = await req.json();
    const userIdStr = String(user.id);

    if (action === 'CREATE_CUSTOM') {
      if (!customBrandName || !customRangeName) {
        return NextResponse.json({ error: 'Nom de marque et de set requis' }, { status: 400 });
      }

      const newBrand = await sql`
        INSERT INTO marker_brands (brand_name, range_name, created_by)
        VALUES (${customBrandName}, ${customRangeName}, ${userIdStr})
        RETURNING id
      `;

      const newBrandId = newBrand[0].id;

      await sql`
        INSERT INTO user_sets (user_id, brand_id)
        VALUES (${userIdStr}, ${newBrandId})
        ON CONFLICT DO NOTHING
      `;

      return NextResponse.json({ success: true, newBrandId });
    }

    if (action === 'ADD') {
      await sql`
        INSERT INTO user_sets (user_id, brand_id)
        VALUES (${userIdStr}, ${brandId})
        ON CONFLICT DO NOTHING
      `;
      await sql`DELETE FROM souhaits WHERE user_id = ${user.id} AND brand_id = ${brandId}`;
    } else if (action === 'REMOVE') {
      await sql`
        DELETE FROM user_sets
        WHERE user_id = ${userIdStr} AND brand_id = ${brandId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/markers/sets :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.' }, { status: 500 });
  }
}