import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { isId } from '@/lib/pages';
import { retirerXP, penaliserXP } from '@/lib/series';
import { prevenir } from '@/lib/push';

// Coloriages d'épreuve signalés parce qu'ils ne correspondent pas à ce qui est demandé (admin et sentinelles)
export async function GET() {
  const { erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const signalements = await sql`
    SELECT s.defi_id, s.page_id, d.titre AS epreuve, d.description, d.genre, count(*)::int AS nombre, max(s.cree_le) AS dernier,
           p.title, OCTET_LENGTH(p.image_b64) AS img_size, u.id AS auteur_id, u.pseudo, u.name, u.email, u.role AS role_auteur, u.genre AS genre_auteur
    FROM defi_signalements s
    JOIN defis d ON d.id = s.defi_id JOIN pages p ON p.id = s.page_id JOIN users u ON u.id = p.user_id
    WHERE NOT s.traite
    GROUP BY s.defi_id, s.page_id, d.titre, d.description, d.genre, p.title, OCTET_LENGTH(p.image_b64), u.id
    ORDER BY count(*) DESC, max(s.cree_le) DESC LIMIT 200`;
  return NextResponse.json({ signalements });
}

// Signaler un coloriage d'épreuve ({ defiId, pageId })
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { defiId, pageId } = await req.json().catch(() => ({}));
  if (!isId(String(pageId || ''))) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  const [p] = await sql`
    SELECT p.user_id FROM defi_participations dp JOIN pages p ON p.id = dp.page_id
    WHERE dp.defi_id = ${Number(defiId)} AND dp.page_id = ${pageId}
    UNION SELECT p.user_id FROM defi_envois e JOIN pages p ON p.id = e.page_id WHERE e.defi_id = ${Number(defiId)} AND e.page_id = ${pageId}`;
  if (!p) return NextResponse.json({ error: 'Ce coloriage n’est pas dans cette épreuve' }, { status: 404 });
  if (String(p.user_id) === String(profil.id)) return NextResponse.json({ error: 'Tu ne peux pas signaler ton propre coloriage' }, { status: 403 });
  await sql`INSERT INTO defi_signalements (defi_id, page_id, user_id) VALUES (${Number(defiId)}, ${pageId}, ${profil.id}) ON CONFLICT DO NOTHING`;
  prevenir('signalements', { postes: ['admin', 'modo'] }, { titre: 'Coloriage signalé', texte: 'Un coloriage d’épreuve a été signalé.', lien: '/profil/admin?onglet=signalements' }, profil.id);
  return NextResponse.json({ ok: true });
}

// Traiter un signalement ({ defiId, pageId, action: 'retirer' | 'ignorer' }).
// Retirer : le coloriage sort de l'épreuve et la personne perd le double des points gagnés avec.
export async function PUT(req) {
  const { erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const { defiId, pageId, action } = await req.json().catch(() => ({}));
  if (!isId(String(pageId || ''))) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  const id = Number(defiId);
  if (action === 'retirer') {
    const [p] = await sql`SELECT user_id FROM pages WHERE id = ${pageId}`;
    if (p) {
      await sql`DELETE FROM defi_envois WHERE defi_id = ${id} AND page_id = ${pageId}`;
      const retire = await sql`DELETE FROM defi_participations WHERE defi_id = ${id} AND page_id = ${pageId} RETURNING user_id`;
      await sql`DELETE FROM verdicts WHERE activite = ${`epreuve:${id}`} AND page_id = ${pageId}`;
      if (retire.length) {
        const gagnes = await retirerXP(p.user_id, `epreuve:${id}`);
        await penaliserXP(p.user_id, `penalite:epreuve:${id}`, gagnes);
      }
    }
  }
  await sql`UPDATE defi_signalements SET traite = true WHERE defi_id = ${id} AND page_id = ${pageId}`;
  return NextResponse.json({ ok: true });
}
