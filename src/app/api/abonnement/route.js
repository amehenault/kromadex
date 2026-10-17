import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

export const dynamic = 'force-dynamic';

// Invocatrice : offrir Kromadex+ à un membre jusqu'à une date ({ userId, jusqu: 'AAAA-MM-JJ' }), ou le retirer ({ jusqu: null }).
// Un abonnement payé n'est pas touché : il reste actif jusqu'à sa propre fin.
export async function PUT(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { userId, jusqu } = await req.json().catch(() => ({}));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(jusqu || '')) ? String(jusqu) : null;
  if (jusqu && !date) return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  // Actif jusqu'à la fin de la journée choisie (heure du Québec)
  const maj = await sql`
    UPDATE users SET plus_offert_jusqu = CASE WHEN ${date}::date IS NULL THEN NULL
      ELSE ((${date}::date + 1)::timestamp AT TIME ZONE 'America/Toronto') END
    WHERE id = ${userId} RETURNING id`;
  if (!maj.length) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
