import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const tomes = await sql`SELECT id, nom, type, collection, nb_pages, nb_pages_manuel, couverture
    FROM tome_catalog ORDER BY type, lower(nom)`;
  return NextResponse.json({ tomes });
}

export async function PUT(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id, nbPages } = await req.json().catch(() => ({}));
  const n = parseInt(nbPages, 10);
  if (!(n >= 1 && n <= 500)) return NextResponse.json({ error: 'Entre un nombre entre 1 et 500' }, { status: 400 });
  const [t] = await sql`UPDATE tome_catalog SET nb_pages = ${n}, nb_pages_manuel = true WHERE id = ${Number(id)} RETURNING id, nb_pages`;
  if (!t) return NextResponse.json({ error: 'Tome introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true, nb_pages: t.nb_pages });
}
