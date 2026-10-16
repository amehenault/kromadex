import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

// Toute personne connectée peut indiquer le nombre de coloriages d'un tome Cozy colo
// du catalogue, seulement s'il est encore inconnu (une fois rempli, il ne change plus).
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { tomeId, nbPages } = await req.json().catch(() => ({}));
  const n = parseInt(nbPages, 10);
  if (!(n >= 1 && n <= 500)) return NextResponse.json({ error: 'Entre un nombre entre 1 et 500' }, { status: 400 });

  const maj = await sql`
    UPDATE tome_catalog SET nb_pages = ${n}
    WHERE id = ${Number(tomeId)} AND type = 'cozy' AND nb_pages IS NULL
    RETURNING id`;
  if (!maj.length) return NextResponse.json({ error: 'Ce nombre est déjà connu ou ne peut pas être modifié' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
