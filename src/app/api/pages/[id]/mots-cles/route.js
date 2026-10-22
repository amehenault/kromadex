import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { cleMot } from '@/lib/cleMot';

export const dynamic = 'force-dynamic';

// Mots-clefs perso d'un de mes coloriages (quand son tome n'est pas dans le catalogue) :
// GET la liste, POST { mot } pour en ajouter un, DELETE { mot } pour le retirer
const propre = (m) => String(m || '').trim().replace(/\s+/g, ' ').slice(0, 40);

async function moi(params) {
  const user = await getUser();
  const { id } = await params;
  if (!user || !isId(id)) return null;
  const [p] = await sql`SELECT id, mots_cles FROM pages WHERE id = ${id} AND user_id = ${user.id}`;
  return p || null;
}

export async function GET(_req, { params }) {
  const p = await moi(params);
  if (!p) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  return NextResponse.json({ mots: p.mots_cles || [] });
}

export async function POST(req, { params }) {
  const p = await moi(params);
  if (!p) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  const mot = propre((await req.json().catch(() => ({}))).mot);
  if (mot.length < 2) return NextResponse.json({ error: 'Le mot-clef doit contenir au moins 2 caractères' }, { status: 400 });
  // Même mot déjà présent (Lapin = lapin = Lapins)
  const existant = (p.mots_cles || []).find((m) => cleMot(m) === cleMot(mot));
  if (existant) return NextResponse.json({ error: `« ${existant} » est déjà sur ce coloriage` }, { status: 409 });
  if ((p.mots_cles || []).length >= 30) return NextResponse.json({ error: '30 mots-clefs maximum par coloriage' }, { status: 400 });
  const [r] = await sql`UPDATE pages SET mots_cles = array_append(mots_cles, ${mot}) WHERE id = ${p.id} RETURNING mots_cles`;
  return NextResponse.json({ mots: r.mots_cles });
}

export async function DELETE(req, { params }) {
  const p = await moi(params);
  if (!p) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  const mot = propre((await req.json().catch(() => ({}))).mot);
  const [r] = await sql`UPDATE pages SET mots_cles = array_remove(mots_cles, ${mot}) WHERE id = ${p.id} RETURNING mots_cles`;
  return NextResponse.json({ mots: r.mots_cles });
}
