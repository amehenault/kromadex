import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { VALEURS_TYPES } from '@/lib/typesColoriage';

export const dynamic = 'force-dynamic';

// « Je fais du… » (types_pratiques) et « Je veux voir les… » (types_vus)
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const [r] = await sql`SELECT types_pratiques, types_vus FROM users WHERE id = ${user.id}`;
  return NextResponse.json({ typesPratiques: r?.types_pratiques || [], typesVus: r?.types_vus || [] });
}

export async function POST(req) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { typesPratiques = [], typesVus = [] } = await req.json();
    const propre = (l) => [...new Set((Array.isArray(l) ? l : []).filter((t) => VALEURS_TYPES.includes(t)))];

    await sql`
      UPDATE users
      SET types_pratiques = ${propre(typesPratiques)}, types_vus = ${propre(typesVus)}
      WHERE id = ${user.id}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erreur POST /api/user/preferences :', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
