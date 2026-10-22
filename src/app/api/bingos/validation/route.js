import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { bingoTermine, recompenserBingo } from '@/lib/clotures';

// Cases de bingo à valider (admin et sentinelles) : le coloriage correspond-il à la case ?
export async function GET() {
  const { erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const cases = await sql`
    SELECT c.bingo_id, c.user_id, c.case_no, c.page_id, c.cree_le, b.titre AS bingo, b.cases[c.case_no + 1] AS tache,
           b.conditions[c.case_no + 1] AS condition, OCTET_LENGTH(p.image_b64) AS img_size, p.title,
           u.pseudo, u.name, u.role
    FROM bingo_cases c JOIN bingos b ON b.id = c.bingo_id JOIN pages p ON p.id = c.page_id JOIN users u ON u.id = c.user_id
    WHERE c.valide IS NULL AND c.page_id IS NOT NULL
    ORDER BY c.cree_le LIMIT 200`;
  return NextResponse.json({ cases });
}

// Valider ou refuser une case ({ bingoId, userId, case, valide })
export async function PUT(req) {
  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const { bingoId, userId, case: no, valide } = await req.json().catch(() => ({}));
  const maj = await sql`
    UPDATE bingo_cases SET valide = ${valide === true}, valide_par = ${profil.id}
    WHERE bingo_id = ${Number(bingoId)} AND user_id = ${userId} AND case_no = ${Number(no)} RETURNING 1`;
  if (!maj.length) return NextResponse.json({ error: 'Case introuvable' }, { status: 404 });
  // Bingo déjà terminé : les XP de la case validée sont versés tout de suite
  if (valide === true && (await bingoTermine(Number(bingoId)))) await recompenserBingo(Number(bingoId), userId);
  return NextResponse.json({ ok: true });
}
