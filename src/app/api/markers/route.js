import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getUser();

    // Récupération avec la colonne sub_type
    const allBrands = await sql`
      SELECT id, brand_name, range_name, COALESCE(sub_type, 'Autre') AS sub_type, created_by 
      FROM marker_brands 
      ORDER BY brand_name ASC, sub_type ASC, id ASC
    `;

    let userMarkerIds = [];
    let userSets = [];

    if (user) {
      const userIdStr = String(user.id);

      const userMarkersRes = await sql`
        SELECT color_id 
        FROM user_markers 
        WHERE user_id = ${userIdStr}
      `;
      userMarkerIds = userMarkersRes.map((m) => Number(m.color_id));

      const userSetsRes = await sql`
        SELECT brand_id 
        FROM user_sets 
        WHERE user_id = ${userIdStr}
      `;
      userSets = userSetsRes.map((s) => Number(s.brand_id));
    }

    return NextResponse.json({
      allBrands,
      userSets,
      userMarkerIds
    });
  } catch (err) {
    console.error('Erreur GET /api/markers :', err);
    return NextResponse.json({ error: err.message, allBrands: [], userSets: [], userMarkerIds: [] }, { status: 500 });
  }
}