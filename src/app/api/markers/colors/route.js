import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const brandIdParam = searchParams.get('brandId');

    if (!brandIdParam) {
      return NextResponse.json({ colors: [] });
    }

    const brandId = parseInt(brandIdParam, 10);

    const colors = await sql`
      SELECT id, brand_id, color_code, color_name, hex_value 
      FROM marker_colors 
      WHERE brand_id = ${brandId}
      ORDER BY id ASC
    `;

    return NextResponse.json({ colors: colors || [] });
  } catch (err) {
    console.error('Erreur API Colors :', err);
    return NextResponse.json({ error: 'Erreur du serveur, réessaie.', colors: [] }, { status: 500 });
  }
}