import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);

// Parcours de quêtes : une quête par fête, avec ses étapes, ses XP et ses dates
export async function GET() {
  const { erreur } = await exigerPoste();
  if (erreur) return erreur;
  const quetes = await sql`
    SELECT id, fete, titre, description, etapes, xp, active,
           to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin
    FROM quetes ORDER BY debut NULLS LAST, fete`;
  return NextResponse.json({ quetes });
}

// Admin : créer ou paramétrer une quête
export async function POST(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const q = await req.json();
  const fete = String(q.fete || '').trim().slice(0, 60);
  const titre = String(q.titre || '').trim().slice(0, 100);
  if (!fete || !titre) return NextResponse.json({ error: 'Fête et titre requis' }, { status: 400 });
  const etapes = (Array.isArray(q.etapes) ? q.etapes : []).map((e) => String(e || '').trim().slice(0, 120)).filter(Boolean).slice(0, 20);
  const xp = Math.max(0, Math.min(5000, parseInt(q.xp, 10) || 0));
  const description = String(q.description || '').slice(0, 1000);
  const active = q.active !== false;

  if (q.id) {
    await sql`UPDATE quetes SET fete = ${fete}, titre = ${titre}, description = ${description}, etapes = ${etapes},
      xp = ${xp}, debut = ${date(q.debut)}, fin = ${date(q.fin)}, active = ${active} WHERE id = ${Number(q.id)}`;
  } else {
    await sql`INSERT INTO quetes (fete, titre, description, etapes, xp, debut, fin, active)
      VALUES (${fete}, ${titre}, ${description}, ${etapes}, ${xp}, ${date(q.debut)}, ${date(q.fin)}, ${active})`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json();
  await sql`DELETE FROM quetes WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
