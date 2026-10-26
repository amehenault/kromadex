import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

export const dynamic = 'force-dynamic';

// Lancement (Invocatrice) : les personnes inscrites, les plus récentes en premier,
// les totaux (aujourd'hui, 7 derniers jours, en tout) et si la notification des nouvelles inscriptions est active.
// Ouvrir l'onglet marque les inscriptions comme vues.
export async function GET() {
  const { profil, erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const [inscrits, [totaux], [moi]] = await Promise.all([
    sql`SELECT id, pseudo, name, role, genre, pays, types_pratiques, created_at
        FROM users WHERE role <> 'admin' ORDER BY created_at DESC LIMIT 500`,
    sql`SELECT count(*)::int AS tous,
               count(*) FILTER (WHERE (created_at AT TIME ZONE 'America/Toronto')::date = (now() AT TIME ZONE 'America/Toronto')::date)::int AS aujourdhui,
               count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS semaine
        FROM users WHERE role <> 'admin'`,
    sql`SELECT COALESCE((notifs ->> 'inscriptions')::boolean, true) AS notif FROM users WHERE id = ${profil.id}`,
  ]);
  // Inscriptions vues : la pastille rouge de Lancement disparaît (lib/notifications.js)
  await sql`UPDATE users SET lancement_vu = now() WHERE id = ${profil.id}`;
  return NextResponse.json({ inscrits, totaux, notif: moi?.notif ?? true });
}
