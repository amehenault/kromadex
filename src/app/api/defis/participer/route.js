import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { isId } from '@/lib/pages';
import { pageConvient } from '@/lib/defis';
import { accorderXP, retirerXP } from '@/lib/series';
import { XP_EPREUVE } from '@/lib/niveaux';
import { jourQuebec } from '@/lib/temps';

const to_iso = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

// Coloriages envoyés pour un défi (?defi=id), les plus aimés en premier
export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const q = new URL(req.url).searchParams;
  // ?mes=1 : mes coloriages publiés, pour en choisir un à envoyer
  if (q.get('mes') === '1') {
    const fiches = await sql`
      SELECT id, title, tome, page_no, type_coloriage, OCTET_LENGTH(image_b64) AS img_size
      FROM pages WHERE user_id = ${user.id} AND publiee ORDER BY publiee_le DESC LIMIT 100`;
    return NextResponse.json({ fiches });
  }
  const id = Number(q.get('defi'));
  const fiches = await sql`
    SELECT p.id, p.title, p.tome, p.page_no, p.type_coloriage, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${user.id}) AS aime
    FROM defi_participations dp JOIN pages p ON p.id = dp.page_id AND p.publiee JOIN users u ON u.id = dp.user_id
    WHERE dp.defi_id = ${id} ORDER BY likes DESC, dp.cree_le ASC LIMIT 200`;
  return NextResponse.json({ fiches });
}

// Participer à un défi, et éventuellement y associer un de ses coloriages publiés ({ defiId, pageId })
export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { defiId, pageId } = await req.json().catch(() => ({}));
  const [d] = await sql`SELECT id, categorie, genre, fin FROM defis WHERE id = ${Number(defiId)}`;
  if (!d) return NextResponse.json({ error: 'Épreuve introuvable' }, { status: 404 });
  if (d.fin && to_iso(d.fin) < jourQuebec()) {
    return NextResponse.json({ error: 'Cette épreuve est terminée' }, { status: 403 });
  }

  let page = null;
  if (pageId) {
    if (!isId(String(pageId))) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
    const [p] = await sql`SELECT id, type_coloriage FROM pages WHERE id = ${pageId} AND user_id = ${user.id} AND publiee`;
    if (!p) return NextResponse.json({ error: 'Choisis un de tes coloriages publiés dans la communauté' }, { status: 400 });
    if (!pageConvient(d.categorie, p.type_coloriage)) {
      return NextResponse.json({ error: "Ce coloriage n'est pas du bon type pour cette épreuve" }, { status: 400 });
    }
    page = p.id;
  }
  await sql`
    INSERT INTO defi_participations (defi_id, user_id, page_id) VALUES (${d.id}, ${user.id}, ${page})
    ON CONFLICT (defi_id, user_id) DO UPDATE SET page_id = COALESCE(EXCLUDED.page_id, defi_participations.page_id)`;
  // Épreuve relevée (coloriage envoyé) : 200 XP, une seule fois par épreuve
  if (page) await accorderXP(user.id, `epreuve:${d.id}`, XP_EPREUVE).catch(() => {});
  return NextResponse.json({ ok: true });
}

// Quitter un défi
export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { defiId } = await req.json().catch(() => ({}));
  await sql`DELETE FROM defi_participations WHERE defi_id = ${Number(defiId)} AND user_id = ${user.id}`;
  // Quitter l'épreuve reprend les XP gagnés pour elle
  await retirerXP(user.id, `epreuve:${Number(defiId)}`).catch(() => {});
  return NextResponse.json({ ok: true });
}
