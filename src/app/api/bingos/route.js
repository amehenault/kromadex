import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);

export async function GET() {
  const { erreur } = await exigerPoste();
  if (erreur) return erreur;
  const bingos = await sql`
    SELECT id, titre, cases, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin
    FROM bingos ORDER BY cree_le DESC LIMIT 50`;
  return NextResponse.json({ bingos });
}

// Admin : créer ou modifier un bingo (grille 5 x 5 = 25 cases, la case du centre peut être « Libre »)
export async function POST(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id, titre, cases, debut, fin } = await req.json();
  const liste = (Array.isArray(cases) ? cases : []).map((c) => String(c || '').trim().slice(0, 80));
  if (!String(titre || '').trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
  if (liste.length !== 25 || liste.some((c) => !c)) {
    return NextResponse.json({ error: 'Les 25 cases doivent être remplies' }, { status: 400 });
  }
  const t = titre.trim().slice(0, 100);
  if (id) {
    await sql`UPDATE bingos SET titre = ${t}, cases = ${liste}, debut = ${date(debut)}, fin = ${date(fin)} WHERE id = ${Number(id)}`;
  } else {
    await sql`INSERT INTO bingos (titre, cases, debut, fin) VALUES (${t}, ${liste}, ${date(debut)}, ${date(fin)})`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json();
  await sql`DELETE FROM bingos WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
