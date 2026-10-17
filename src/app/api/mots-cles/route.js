import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { mesTypesVisibles } from '@/lib/visibilite';
import { prevenir } from '@/lib/push';

const RAISONS = ['repetition', 'faux', 'inapproprie'];
const propre = (m) => String(m || '').trim().replace(/\s+/g, ' ').slice(0, 40);

// ?tome=id : mots-clés d'un tome
// ?q=texte : recherche de tomes et livres par nom ou par mot-clé (barre de recherche)
// ?gestion=1 : tous les mots-clés, les plus signalés en premier (admin et sentinelles)
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const p = new URL(req.url).searchParams;

  if (p.get('gestion') === '1') {
    if (!['admin', 'modo'].includes(profil.role)) return NextResponse.json({ error: 'Accès restreint' }, { status: 403 });
    const mots = await sql`
      SELECT m.id, m.mot, m.page_no, m.cree_le, c.nom AS tome, u.id AS auteur_id, u.pseudo, u.email, u.role AS role_auteur,
             (SELECT count(*)::int FROM mot_cle_signalements s WHERE s.mot_cle_id = m.id) AS signalements,
             (SELECT json_object_agg(r, n) FROM (SELECT raison AS r, count(*)::int AS n FROM mot_cle_signalements s WHERE s.mot_cle_id = m.id GROUP BY raison) x) AS raisons
      FROM mots_cles m JOIN tome_catalog c ON c.id = m.tome_id LEFT JOIN users u ON u.id = m.user_id
      ORDER BY signalements DESC, m.cree_le DESC LIMIT 500`;
    return NextResponse.json({ mots });
  }

  if (p.get('tome')) {
    const mots = await sql`
      SELECT m.id, m.mot, m.page_no, u.pseudo, u.role, (m.user_id = ${profil.id}) AS moi,
             (SELECT raison FROM mot_cle_signalements s WHERE s.mot_cle_id = m.id AND s.user_id = ${profil.id}) AS mon_signalement
      FROM mots_cles m LEFT JOIN users u ON u.id = m.user_id
      WHERE m.tome_id = ${Number(p.get('tome'))}
      ORDER BY lower(m.mot), m.page_no`;
    return NextResponse.json({ mots });
  }

  const q = propre(p.get('q'));
  if (q.length < 2) return NextResponse.json({ resultats: [] });
  const motif = `%${q.toLowerCase()}%`;
  const visibles = await mesTypesVisibles(profil.id);
  const resultats = await sql`
    SELECT c.id, c.nom, c.couverture, c.type, c.collection,
           EXISTS (SELECT 1 FROM user_tomes u WHERE u.tome_id = c.id AND u.user_id = ${String(profil.id)}) AS possede,
           (lower(c.nom) LIKE ${motif}) AS par_nom,
           COALESCE((SELECT json_agg(json_build_object('mot', m.mot, 'page', m.page_no) ORDER BY m.page_no)
                     FROM mots_cles m WHERE m.tome_id = c.id AND lower(m.mot) LIKE ${motif}), '[]') AS mots
    FROM tome_catalog c
    WHERE c.type = ANY(${visibles})
      AND (lower(c.nom) LIKE ${motif} OR EXISTS (SELECT 1 FROM mots_cles m WHERE m.tome_id = c.id AND lower(m.mot) LIKE ${motif}))
    ORDER BY par_nom DESC, c.nom LIMIT 40`;
  return NextResponse.json({ resultats });
}

// Ajouter un mot-clé à un tome qu'on possède ({ tomeId, mot, pageNo? }), ou signaler un mot-clé ({ signaler, raison })
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const b = await req.json().catch(() => ({}));

  if (b.signaler) {
    if (!RAISONS.includes(b.raison)) return NextResponse.json({ error: 'Choisis une raison' }, { status: 400 });
    await sql`INSERT INTO mot_cle_signalements (mot_cle_id, user_id, raison) VALUES (${Number(b.signaler)}, ${profil.id}, ${b.raison})
      ON CONFLICT (mot_cle_id, user_id) DO UPDATE SET raison = EXCLUDED.raison`;
    prevenir('signalements', { postes: ['admin', 'modo'] }, { titre: 'Mot-clef signalé', texte: 'Un mot-clef a été signalé.', lien: '/profil/admin?onglet=motscles' }, profil.id);
    return NextResponse.json({ ok: true });
  }

  const mot = propre(b.mot);
  if (mot.length < 2) return NextResponse.json({ error: 'Le mot-clé doit contenir au moins 2 caractères' }, { status: 400 });
  const pageNo = String(b.pageNo || '').trim().slice(0, 10);
  if (pageNo && !/^\d+$/.test(pageNo)) return NextResponse.json({ error: 'Le numéro de page doit être un nombre' }, { status: 400 });
  const [possede] = await sql`SELECT 1 FROM user_tomes WHERE user_id = ${String(profil.id)} AND tome_id = ${Number(b.tomeId)}`;
  if (!possede) return NextResponse.json({ error: 'Tu peux ajouter des mots-clés seulement aux tomes que tu possèdes' }, { status: 403 });
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM mots_cles WHERE user_id = ${profil.id} AND cree_le > now() - interval '1 day'`;
  if (n >= 50) return NextResponse.json({ error: 'Tu as déjà ajouté 50 mots-clés aujourd’hui' }, { status: 429 });
  const cree = await sql`INSERT INTO mots_cles (tome_id, page_no, mot, user_id) VALUES (${Number(b.tomeId)}, ${pageNo}, ${mot}, ${profil.id})
    ON CONFLICT DO NOTHING RETURNING id`;
  if (!cree.length) return NextResponse.json({ error: 'Ce mot-clé existe déjà pour cette page' }, { status: 409 });
  return NextResponse.json({ ok: true });
}

// Admin et sentinelles : modifier un mot-clé ({ id, mot })
export async function PUT(req) {
  const { erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const { id, mot } = await req.json().catch(() => ({}));
  const m = propre(mot);
  if (m.length < 2) return NextResponse.json({ error: 'Mot-clé trop court' }, { status: 400 });
  await sql`UPDATE mots_cles SET mot = ${m} WHERE id = ${Number(id)}`;
  // Les signalements portaient sur l'ancien mot : on repart de zéro
  await sql`DELETE FROM mot_cle_signalements WHERE mot_cle_id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}

// Supprimer : son propre mot-clé, ou n'importe lequel pour l'admin et les sentinelles
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  if (['admin', 'modo'].includes(profil.role)) await sql`DELETE FROM mots_cles WHERE id = ${Number(id)}`;
  else await sql`DELETE FROM mots_cles WHERE id = ${Number(id)} AND user_id = ${profil.id}`;
  return NextResponse.json({ ok: true });
}
