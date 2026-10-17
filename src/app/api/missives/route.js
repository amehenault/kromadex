import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';

// Date d'échéance de l'épinglage (AAAA-MM-JJ) ou null
const dateEpingle = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null);

// Missives : messages à toute la communauté. Une missive peut être épinglée sur l'accueil jusqu'à une date.
// L'admin publie directement, une missive de modo attend l'approbation de l'admin.
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;

  // ?gestion=1 : l'admin voit tout, la modo voit les siennes et celles publiées
  if (new URL(req.url).searchParams.get('gestion') && ['admin', 'modo'].includes(profil.role)) {
    const missives = await sql`
      SELECT m.id, m.titre, m.contenu, m.cree_le, m.statut, to_char(m.epinglee_jusqu, 'YYYY-MM-DD') AS epinglee_jusqu, u.pseudo AS auteur, u.role AS role_auteur
      FROM missives m LEFT JOIN users u ON u.id = m.auteur
      WHERE ${profil.role === 'admin'} OR m.auteur = ${profil.id} OR m.statut = 'publiee'
      ORDER BY (m.statut = 'en_attente') DESC, m.cree_le DESC LIMIT 100`;
    return NextResponse.json({ missives });
  }

  const missives = await sql`
    SELECT m.id, m.titre, m.contenu, m.cree_le, m.commentaires, (l.user_id IS NOT NULL) AS lue,
           COALESCE(m.epinglee_jusqu >= (now() AT TIME ZONE 'America/Toronto')::date, false) AS epinglee,
           (SELECT count(*)::int FROM missive_likes k WHERE k.missive_id = m.id) AS likes,
           EXISTS (SELECT 1 FROM missive_likes k WHERE k.missive_id = m.id AND k.user_id = ${profil.id}) AS aime,
           (SELECT count(*)::int FROM missive_commentaires c WHERE c.missive_id = m.id) AS nb_commentaires
    FROM missives m LEFT JOIN missives_lues l ON l.missive_id = m.id AND l.user_id = ${profil.id}
    WHERE m.statut = 'publiee'
    ORDER BY m.cree_le DESC LIMIT 100`;
  return NextResponse.json({ missives });
}

// Admin ou modo : écrire une missive. Tout le monde : marquer une missive comme lue ({ lue: id })
// ou l'aimer / ne plus l'aimer ({ like: id })
export async function POST(req) {
  const corps = await req.json();
  if (corps.like) {
    const { profil, erreur } = await exigerPoste();
    if (erreur) return erreur;
    const id = Number(corps.like);
    const [m] = await sql`SELECT 1 FROM missives WHERE id = ${id} AND statut = 'publiee'`;
    if (!m) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    const retire = await sql`DELETE FROM missive_likes WHERE user_id = ${profil.id} AND missive_id = ${id} RETURNING 1`;
    if (!retire.length) await sql`INSERT INTO missive_likes (user_id, missive_id) VALUES (${profil.id}, ${id}) ON CONFLICT DO NOTHING`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM missive_likes WHERE missive_id = ${id}`;
    return NextResponse.json({ aime: !retire.length, likes: n });
  }
  if (corps.lue) {
    const { profil, erreur } = await exigerPoste();
    if (erreur) return erreur;
    await sql`INSERT INTO missives_lues (user_id, missive_id) VALUES (${profil.id}, ${Number(corps.lue)}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true });
  }

  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const titre = String(corps.titre || '').trim().slice(0, 120);
  if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
  const statut = profil.role === 'admin' ? 'publiee' : 'en_attente';
  await sql`INSERT INTO missives (titre, contenu, auteur, statut, commentaires, epinglee_jusqu)
    VALUES (${titre}, ${String(corps.contenu || '').slice(0, 4000)}, ${profil.id}, ${statut}, ${corps.commentaires !== false},
            ${dateEpingle(corps.epingleeJusqu)})`;
  return NextResponse.json({ ok: true, statut });
}

// Admin : approuver ou refuser une missive en attente, ou changer son épinglage ({ id, epingleeJusqu })
export async function PUT(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id, statut, ...corps } = await req.json();
  if ('epingleeJusqu' in corps) {
    await sql`UPDATE missives SET epinglee_jusqu = ${dateEpingle(corps.epingleeJusqu)} WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  }
  if (!['publiee', 'refusee'].includes(statut)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  // Une missive approuvée prend la date d'approbation pour apparaître en haut de l'accueil
  await sql`UPDATE missives SET statut = ${statut}, cree_le = CASE WHEN ${statut} = 'publiee' THEN now() ELSE cree_le END WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}

// Admin : supprimer n'importe quelle missive. Modo : retirer sa missive tant qu'elle n'est pas publiée
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const { id } = await req.json();
  if (profil.role === 'admin') await sql`DELETE FROM missives WHERE id = ${Number(id)}`;
  else await sql`DELETE FROM missives WHERE id = ${Number(id)} AND auteur = ${profil.id} AND statut <> 'publiee'`;
  return NextResponse.json({ ok: true });
}
