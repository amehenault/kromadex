import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';

// Cocher ou décocher une case de bingo ({ bingoId, case, pageId? }).
// Avec un coloriage, la case est cochée (ou son coloriage remplacé) ; sans coloriage, elle bascule.
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { bingoId, case: no, pageId } = await req.json().catch(() => ({}));
  const n = Number(no);
  if (!(n >= 0 && n <= 24)) return NextResponse.json({ error: 'Case invalide' }, { status: 400 });
  const [b] = await sql`SELECT id, cardinality(cases) AS taille FROM bingos WHERE id = ${Number(bingoId)}
    AND debut <= (now() AT TIME ZONE 'America/Toronto')::date
    AND COALESCE(fin, (date_trunc('month', debut) + interval '1 month - 1 day')::date) >= (now() AT TIME ZONE 'America/Toronto')::date`;
  if (!b) return NextResponse.json({ error: "Ce bingo n'est pas en cours" }, { status: 403 });
  if (n >= b.taille) return NextResponse.json({ error: 'Case invalide' }, { status: 400 });

  if (pageId) {
    if (!isId(String(pageId))) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
    const [p] = await sql`SELECT 1 FROM pages WHERE id = ${pageId} AND user_id = ${user.id}`;
    if (!p) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
    await sql`INSERT INTO bingo_cases (bingo_id, user_id, case_no, page_id) VALUES (${b.id}, ${user.id}, ${n}, ${pageId})
      ON CONFLICT (bingo_id, user_id, case_no) DO UPDATE SET page_id = EXCLUDED.page_id`;
    return NextResponse.json({ cochee: true });
  }
  const retire = await sql`DELETE FROM bingo_cases WHERE bingo_id = ${b.id} AND user_id = ${user.id} AND case_no = ${n} RETURNING 1`;
  if (!retire.length) await sql`INSERT INTO bingo_cases (bingo_id, user_id, case_no) VALUES (${b.id}, ${user.id}, ${n}) ON CONFLICT DO NOTHING`;
  return NextResponse.json({ cochee: !retire.length });
}
