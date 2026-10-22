import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

export const dynamic = 'force-dynamic';

// Kromadex+ offert par l'Invocatrice (onglet Kromadex+ de son espace).
// Un abonnement payé n'est jamais touché ici : il reste actif jusqu'à sa propre fin.

// Les membres à qui Kromadex+ est offert, les plus récents en premier
export async function GET() {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const membres = await sql`
    SELECT id, pseudo, name, role, plus_offert_raison AS raison, plus_offert_le AS depuis,
           to_char(plus_offert_jusqu AT TIME ZONE 'America/Toronto' - interval '1 day', 'YYYY-MM-DD') AS jusqu,
           (plus_offert_jusqu IS NOT NULL AND plus_offert_jusqu <= now()) AS expire
    FROM users WHERE plus_offert ORDER BY plus_offert_le DESC NULLS LAST`;
  return NextResponse.json({ membres });
}

// Offrir ou modifier : { userId, jusqu: 'AAAA-MM-JJ' ou null (sans date limite), raison }
export async function PUT(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { userId, jusqu, raison } = await req.json().catch(() => ({}));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(jusqu || '')) ? String(jusqu) : null;
  if (jusqu && !date) return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  // Actif jusqu'à la fin de la journée choisie (heure du Québec)
  const maj = await sql`
    UPDATE users SET plus_offert = true,
      plus_offert_jusqu = CASE WHEN ${date}::date IS NULL THEN NULL ELSE ((${date}::date + 1)::timestamp AT TIME ZONE 'America/Toronto') END,
      plus_offert_raison = ${String(raison || '').trim().slice(0, 300)},
      plus_offert_le = COALESCE(plus_offert_le, now())
    WHERE id = ${userId} AND role <> 'admin' RETURNING id`;
  if (!maj.length) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// Retirer Kromadex+ offert : { userId }
export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { userId } = await req.json().catch(() => ({}));
  await sql`UPDATE users SET plus_offert = false, plus_offert_jusqu = NULL, plus_offert_raison = '', plus_offert_le = NULL WHERE id = ${userId}`;
  return NextResponse.json({ ok: true });
}
