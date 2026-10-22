import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Roue du Destin :
//  { tome, page } : noter un tirage (on garde les 20 derniers, sauf ceux ajoutés aux quêtes) et renvoyer son id
//  { quete: id } : ajouter le tirage aux quêtes (14 jours pour le colorier et gagner 10 XP)
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const b = await req.json().catch(() => ({}));

  if (b.quete) {
    const maj = await sql`UPDATE roue_tirages SET quete_le = COALESCE(quete_le, now())
      WHERE id = ${Number(b.quete)} AND user_id = ${user.id} RETURNING id`;
    if (!maj.length) return NextResponse.json({ error: 'Tirage introuvable' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const nom = String(b.tome || '').trim().slice(0, 120);
  const no = String(b.page || '').trim().slice(0, 10);
  if (!nom || !no) return NextResponse.json({ error: 'Tirage invalide' }, { status: 400 });
  const [t] = await sql`INSERT INTO roue_tirages (user_id, tome, page_no) VALUES (${user.id}, ${nom}, ${no}) RETURNING id`;
  await sql`DELETE FROM roue_tirages WHERE user_id = ${user.id} AND quete_le IS NULL AND id NOT IN (
    SELECT id FROM roue_tirages WHERE user_id = ${user.id} ORDER BY tire_le DESC LIMIT 20)`;
  return NextResponse.json({ ok: true, id: t.id });
}

// Abandonner une quête du Destin en cours ({ quete: id }) : elle disparaît, sans XP
export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { quete } = await req.json().catch(() => ({}));
  const retire = await sql`DELETE FROM roue_tirages
    WHERE id = ${Number(quete) || 0} AND user_id = ${user.id} AND quete_le IS NOT NULL AND termine_le IS NULL RETURNING id`;
  if (!retire.length) return NextResponse.json({ error: 'Quête introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
