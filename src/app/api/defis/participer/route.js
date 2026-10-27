import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { pageConvient } from '@/lib/defis';
import { accorderXP, retirerXP } from '@/lib/series';
import { XP_EPREUVES } from '@/lib/activites';
import { jourQuebec } from '@/lib/temps';

const to_iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  if (q.get('mes') === '1') {
    const fiches = await sql`
      SELECT id, title, tome, page_no, COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') AS type_coloriage, OCTET_LENGTH(image_b64) AS img_size
      FROM pages WHERE user_id = ${user.id} AND publiee ORDER BY publiee_le DESC LIMIT 100`;
    return NextResponse.json({ fiches });
  }
  const id = Number(q.get('defi'));
  const fiches = await sql`
    SELECT p.id, p.title, OCTET_LENGTH(p.image_b64) AS img_size, e.user_id = ${user.id} AS a_moi
    FROM defi_envois e JOIN defis d ON d.id = e.defi_id AND d.genre = 'groupe' JOIN pages p ON p.id = e.page_id
    WHERE e.defi_id = ${id} ORDER BY e.cree_le DESC LIMIT 300`;
  return NextResponse.json({ fiches });
}

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { defiId, pageId } = await req.json().catch(() => ({}));
  const [d] = await sql`SELECT id, categorie, genre, fin, multiple, cloture FROM defis WHERE id = ${Number(defiId)}`;
  if (!d) return NextResponse.json({ error: 'Épreuve introuvable' }, { status: 404 });
  if (d.cloture || (d.fin && to_iso(d.fin) < jourQuebec())) {
    return NextResponse.json({ error: 'Cette épreuve est terminée' }, { status: 403 });
  }

  let page = null;
  if (pageId) {
    if (!isId(String(pageId))) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
    const [p] = await sql`SELECT id, COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') AS type_coloriage FROM pages WHERE id = ${pageId} AND user_id = ${user.id} AND publiee`;
    if (!p) return NextResponse.json({ error: 'Choisis un de tes coloriages publiés dans la communauté' }, { status: 400 });
    if (!pageConvient(d.categorie, p.type_coloriage)) {
      return NextResponse.json({ error: "Ce coloriage n'est pas du bon type pour cette épreuve" }, { status: 400 });
    }
    page = p.id;
  }

  if (d.genre === 'groupe') {
    await sql`INSERT INTO defi_participations (defi_id, user_id) VALUES (${d.id}, ${user.id}) ON CONFLICT DO NOTHING`;
    if (page) {
      if (!d.multiple) await sql`DELETE FROM defi_envois WHERE defi_id = ${d.id} AND user_id = ${user.id}`;
      await sql`INSERT INTO defi_envois (defi_id, user_id, page_id) VALUES (${d.id}, ${user.id}, ${page}) ON CONFLICT DO NOTHING`;
      await sql`UPDATE defi_participations SET page_id = ${page} WHERE defi_id = ${d.id} AND user_id = ${user.id}`;
    }
    return NextResponse.json({ ok: true });
  }

  const [avant] = await sql`SELECT page_id FROM defi_participations WHERE defi_id = ${d.id} AND user_id = ${user.id}`;
  if (page && avant?.page_id && String(avant.page_id) !== String(page)) {
    await sql`UPDATE verdicts SET page_id = ${page} WHERE activite = ${`epreuve:${d.id}`} AND page_id = ${avant.page_id}`;
  }
  await sql`
    INSERT INTO defi_participations (defi_id, user_id, page_id) VALUES (${d.id}, ${user.id}, ${page})
    ON CONFLICT (defi_id, user_id) DO UPDATE SET page_id = COALESCE(EXCLUDED.page_id, defi_participations.page_id),
      cree_le = CASE WHEN EXCLUDED.page_id IS NOT NULL THEN now() ELSE defi_participations.cree_le END`;
  if (page) await accorderXP(user.id, `epreuve:${d.id}`, XP_EPREUVES[d.genre]?.participation || 0).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { defiId, pageId } = await req.json().catch(() => ({}));
  const [d] = await sql`SELECT id, cloture FROM defis WHERE id = ${Number(defiId)}`;
  if (!d || d.cloture) return NextResponse.json({ error: 'Cette épreuve est terminée' }, { status: 403 });
  if (pageId && isId(String(pageId))) {
    await sql`DELETE FROM defi_envois WHERE defi_id = ${d.id} AND user_id = ${user.id} AND page_id = ${pageId}`;
    return NextResponse.json({ ok: true });
  }
  await sql`DELETE FROM defi_envois WHERE defi_id = ${d.id} AND user_id = ${user.id}`;
  await sql`DELETE FROM defi_participations WHERE defi_id = ${d.id} AND user_id = ${user.id}`;
  await sql`DELETE FROM verdicts WHERE activite = ${`epreuve:${d.id}`} AND page_id IN (SELECT id FROM pages WHERE user_id = ${user.id})`;
  await retirerXP(user.id, `epreuve:${d.id}`).catch(() => {});
  return NextResponse.json({ ok: true });
}
