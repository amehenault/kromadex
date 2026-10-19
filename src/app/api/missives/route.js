import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { prevenir } from '@/lib/push';
import { lireSondage } from '@/lib/sondages';


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
      SELECT m.id, m.titre, m.contenu, m.cree_le, m.statut, to_char(m.epinglee_jusqu, 'YYYY-MM-DD') AS epinglee_jusqu, u.pseudo AS auteur, u.role AS role_auteur,
             -- Sondage : réponses, résultats, mes votes, encore ouvert ou non
             CASE WHEN cardinality(m.sondage_options) > 0 THEN json_build_object(
               'options', m.sondage_options, 'multiple', m.sondage_multiple, 'heures', m.sondage_heures, 'fin', m.sondage_fin,
               'ouvert', m.sondage_fin IS NULL OR m.sondage_fin > now(),
               'votes', (SELECT COALESCE(json_agg(json_build_object('option', x.option_no, 'n', x.n)), '[]')
                         FROM (SELECT option_no, count(*)::int AS n FROM missive_votes v WHERE v.missive_id = m.id GROUP BY option_no) x),
               'votants', (SELECT count(DISTINCT v.user_id)::int FROM missive_votes v WHERE v.missive_id = m.id),
               'mes_votes', (SELECT COALESCE(json_agg(v.option_no), '[]') FROM missive_votes v WHERE v.missive_id = m.id AND v.user_id = ${profil.id})
             ) END AS sondage
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
           (SELECT count(*)::int FROM missive_commentaires c WHERE c.missive_id = m.id) AS nb_commentaires,
           -- Sondage : réponses, résultats, mes votes, encore ouvert ou non
             CASE WHEN cardinality(m.sondage_options) > 0 THEN json_build_object(
               'options', m.sondage_options, 'multiple', m.sondage_multiple, 'heures', m.sondage_heures, 'fin', m.sondage_fin,
               'ouvert', m.sondage_fin IS NULL OR m.sondage_fin > now(),
               'votes', (SELECT COALESCE(json_agg(json_build_object('option', x.option_no, 'n', x.n)), '[]')
                         FROM (SELECT option_no, count(*)::int AS n FROM missive_votes v WHERE v.missive_id = m.id GROUP BY option_no) x),
               'votants', (SELECT count(DISTINCT v.user_id)::int FROM missive_votes v WHERE v.missive_id = m.id),
               'mes_votes', (SELECT COALESCE(json_agg(v.option_no), '[]') FROM missive_votes v WHERE v.missive_id = m.id AND v.user_id = ${profil.id})
             ) END AS sondage
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
  // Voter à un sondage ({ vote: missiveId, options: [numéros] }) : remplace les votes précédents
  if (corps.vote) {
    const { profil, erreur } = await exigerPoste();
    if (erreur) return erreur;
    const id = Number(corps.vote);
    const [m] = await sql`SELECT sondage_options, sondage_multiple, (sondage_fin IS NULL OR sondage_fin > now()) AS ouvert
      FROM missives WHERE id = ${id} AND statut = 'publiee' AND cardinality(sondage_options) > 0`;
    if (!m) return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 });
    if (!m.ouvert) return NextResponse.json({ error: 'Ce sondage est terminé' }, { status: 403 });
    const choix = [...new Set((Array.isArray(corps.options) ? corps.options : []).map(Number))]
      .filter((n) => Number.isInteger(n) && n >= 0 && n < m.sondage_options.length);
    if (!choix.length) return NextResponse.json({ error: 'Choisis au moins une réponse' }, { status: 400 });
    if (!m.sondage_multiple && choix.length > 1) return NextResponse.json({ error: 'Une seule réponse est permise' }, { status: 400 });
    await sql`DELETE FROM missive_votes WHERE missive_id = ${id} AND user_id = ${profil.id}`;
    for (const n of choix) await sql`INSERT INTO missive_votes (missive_id, user_id, option_no) VALUES (${id}, ${profil.id}, ${n}) ON CONFLICT DO NOTHING`;
    // Voter compte comme avoir lu la missive
    await sql`INSERT INTO missives_lues (user_id, missive_id) VALUES (${profil.id}, ${id}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true });
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
  // Sondage facultatif : sa durée commence à la publication (tout de suite pour l'admin, à l'approbation sinon)
  const sondage = lireSondage(corps.sondage);
  if (sondage?.erreur) return NextResponse.json({ error: sondage.erreur }, { status: 400 });
  await sql`INSERT INTO missives (titre, contenu, auteur, statut, commentaires, epinglee_jusqu, sondage_options, sondage_multiple, sondage_heures, sondage_fin)
    VALUES (${titre}, ${String(corps.contenu || '').slice(0, 4000)}, ${profil.id}, ${statut}, ${corps.commentaires !== false},
            ${dateEpingle(corps.epingleeJusqu)}, ${sondage ? sondage.options : []}, ${sondage?.multiple || false}, ${sondage?.heures || null},
            ${sondage && statut === 'publiee' ? new Date(Date.now() + sondage.heures * 3600000).toISOString() : null})`;
  if (statut === 'publiee') prevenir('missives', { tous: true }, { titre: 'Nouvelle missive', texte: titre, lien: '/missives' }, profil.id);
  else prevenir('missivesAttente', { postes: ['admin'] }, { titre: 'Missive à approuver', texte: titre, lien: '/profil/admin?onglet=missives' }, profil.id);
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
  // Le sondage d'une missive approuvée commence au moment de l'approbation
  const [m] = await sql`UPDATE missives SET statut = ${statut}, cree_le = CASE WHEN ${statut} = 'publiee' THEN now() ELSE cree_le END,
      sondage_fin = CASE WHEN ${statut} = 'publiee' AND sondage_heures IS NOT NULL THEN now() + make_interval(hours => sondage_heures) ELSE sondage_fin END
    WHERE id = ${Number(id)} RETURNING titre`;
  if (m && statut === 'publiee') prevenir('missives', { tous: true }, { titre: 'Nouvelle missive', texte: m.titre, lien: '/missives' });
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
