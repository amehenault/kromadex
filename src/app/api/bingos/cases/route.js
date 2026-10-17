import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { verifierLimite } from '@/lib/abonnement';
import { prevenir } from '@/lib/push';

// Ajouter un coloriage à une case de bingo ({ bingoId, case, pageId }), ou le retirer ({ bingoId, case } sans coloriage).
// La case attend ensuite la validation de l'admin ou d'une sentinelle.
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { bingoId, case: no, pageId } = await req.json().catch(() => ({}));
  const n = Number(no);
  if (!(n >= 0 && n <= 24)) return NextResponse.json({ error: 'Case invalide' }, { status: 400 });
  const [b] = await sql`SELECT id, cardinality(cases) AS taille FROM bingos WHERE id = ${Number(bingoId)}
    AND debut <= (now() AT TIME ZONE 'America/Toronto')::date
    AND COALESCE(fin, (date_trunc('month', debut) + interval '1 month - 2 days')::date) >= (now() AT TIME ZONE 'America/Toronto')::date`;
  if (!b) return NextResponse.json({ error: "Ce bingo n'est pas en cours" }, { status: 403 });
  if (n >= b.taille) return NextResponse.json({ error: 'Case invalide' }, { status: 400 });

  if (!pageId) {
    await sql`DELETE FROM bingo_cases WHERE bingo_id = ${b.id} AND user_id = ${user.id} AND case_no = ${n}`;
    return NextResponse.json({ ok: true });
  }
  if (!isId(String(pageId))) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  const [p] = await sql`SELECT 1 FROM pages WHERE id = ${pageId} AND user_id = ${user.id} AND image_b64 IS NOT NULL`;
  if (!p) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  const limite = await verifierLimite(user.id, 'bingos', { bingoId: b.id });
  if (limite) return limite;
  await sql`INSERT INTO bingo_cases (bingo_id, user_id, case_no, page_id) VALUES (${b.id}, ${user.id}, ${n}, ${pageId})
    ON CONFLICT (bingo_id, user_id, case_no) DO UPDATE SET page_id = EXCLUDED.page_id, valide = NULL, valide_par = NULL`;
  prevenir('validation', { postes: ['admin', 'modo'] }, { titre: 'Case de bingo à valider', texte: 'Un coloriage attend ta validation.', lien: '/profil/admin?onglet=validation' }, user.id);
  return NextResponse.json({ ok: true });
}
