import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { prevenir } from '@/lib/push';
import { isId } from '@/lib/pages';
import { GENRES_SIGNALEMENT, RAISONS_SIGNALEMENT } from '@/lib/signalements';

async function auteurDe(genre, cible) {
  if (genre === 'coloriage') {
    if (!isId(cible)) return null;
    return (await sql`SELECT p.user_id, u.role FROM pages p JOIN users u ON u.id = p.user_id WHERE p.id = ${cible} AND p.publiee`)[0];
  }
  if (genre === 'commentaire') {
    return (await sql`SELECT c.user_id, u.role FROM page_commentaires c JOIN users u ON u.id = c.user_id WHERE c.id = ${Number(cible) || 0}`)[0];
  }
  if (genre === 'commentaire_missive') {
    return (await sql`SELECT c.user_id, u.role FROM missive_commentaires c JOIN users u ON u.id = c.user_id WHERE c.id = ${Number(cible) || 0}`)[0];
  }
  if (genre === 'publication') {
    return (await sql`SELECT p.user_id, u.role FROM publications p JOIN users u ON u.id = p.user_id WHERE p.id = ${Number(cible) || 0}`)[0];
  }
  if (genre === 'commentaire_publication') {
    return (await sql`SELECT c.user_id, u.role FROM publication_commentaires c JOIN users u ON u.id = c.user_id WHERE c.id = ${Number(cible) || 0}`)[0];
  }
  if (genre === 'membre') {
    if (!isId(cible)) return null;
    return (await sql`SELECT id AS user_id, role FROM users WHERE id = ${cible}`)[0];
  }
  return null;
}

export async function GET() {
  const { erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const groupes = await sql`
    SELECT s.genre, s.cible, count(*)::int AS nombre, max(s.cree_le) AS dernier,
           json_agg(json_build_object('raison', s.raison, 'details', s.details, 'pseudo', r.pseudo, 'name', r.name) ORDER BY s.cree_le) AS signalements
    FROM signalements s LEFT JOIN users r ON r.id = s.user_id
    WHERE NOT s.traite
    GROUP BY s.genre, s.cible ORDER BY max(s.cree_le) DESC LIMIT 100`;

  const ids = (g) => groupes.filter((x) => x.genre === g).map((x) => x.cible);
  const nums = (g) => ids(g).map(Number).filter(Number.isInteger);
  const [coloriages, commentaires, commentairesMissives, membres, publications, commentairesPublications] = await Promise.all([
    ids('coloriage').filter(isId).length ? sql`
      SELECT p.id::text AS cible, p.title, OCTET_LENGTH(p.image_b64) AS img_size, p.publiee,
             u.id AS auteur_id, u.pseudo, u.name, u.role, u.genre
      FROM pages p JOIN users u ON u.id = p.user_id WHERE p.id = ANY(${ids('coloriage').filter(isId)}::uuid[])` : [],
    nums('commentaire').length ? sql`
      SELECT c.id::text AS cible, c.texte, c.page_id, p.title, u.id AS auteur_id, u.pseudo, u.name, u.role, u.genre
      FROM page_commentaires c JOIN users u ON u.id = c.user_id JOIN pages p ON p.id = c.page_id WHERE c.id = ANY(${nums('commentaire')})` : [],
    nums('commentaire_missive').length ? sql`
      SELECT c.id::text AS cible, c.texte, m.titre, u.id AS auteur_id, u.pseudo, u.name, u.role, u.genre
      FROM missive_commentaires c JOIN users u ON u.id = c.user_id JOIN missives m ON m.id = c.missive_id WHERE c.id = ANY(${nums('commentaire_missive')})` : [],
    ids('membre').filter(isId).length ? sql`
      SELECT u.id::text AS cible, u.id AS auteur_id, u.pseudo, u.name, u.role, u.genre, u.bio, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj
      FROM users u WHERE u.id = ANY(${ids('membre').filter(isId)}::uuid[])` : [],
    nums('publication').length ? sql`
      SELECT p.id::text AS cible, p.genre AS genre_publication, p.texte, (SELECT count(*)::int FROM publication_images i WHERE i.publication_id = p.id) AS nb_images,
             u.id AS auteur_id, u.pseudo, u.name, u.role, u.genre
      FROM publications p JOIN users u ON u.id = p.user_id WHERE p.id = ANY(${nums('publication')})` : [],
    nums('commentaire_publication').length ? sql`
      SELECT c.id::text AS cible, c.texte, left(p.texte, 80) AS titre, u.id AS auteur_id, u.pseudo, u.name, u.role, u.genre
      FROM publication_commentaires c JOIN users u ON u.id = c.user_id JOIN publications p ON p.id = c.publication_id WHERE c.id = ANY(${nums('commentaire_publication')})` : [],
  ]);
  const contenus = { coloriage: coloriages, commentaire: commentaires, commentaire_missive: commentairesMissives, membre: membres,
    publication: publications, commentaire_publication: commentairesPublications };
  const liste = groupes.map((g) => ({ ...g, contenu: contenus[g.genre].find((c) => c.cible === g.cible) || null }));
  return NextResponse.json({ signalements: liste });
}

export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const corps = await req.json().catch(() => ({}));
  const genre = String(corps.genre || '');
  const cible = String(corps.cible || '');
  if (!GENRES_SIGNALEMENT[genre]) return NextResponse.json({ error: 'Contenu invalide' }, { status: 400 });
  if (!RAISONS_SIGNALEMENT.includes(corps.raison)) return NextResponse.json({ error: 'Choisis une raison' }, { status: 400 });
  const details = String(corps.details || '').trim().slice(0, 500);
  if (corps.raison === 'Autre' && details.length < 3) return NextResponse.json({ error: 'Explique ce qui ne va pas' }, { status: 400 });

  const auteur = await auteurDe(genre, cible);
  if (!auteur) return NextResponse.json({ error: 'Ce contenu n’existe plus' }, { status: 404 });
  if (String(auteur.user_id) === String(profil.id)) return NextResponse.json({ error: 'Tu ne peux pas signaler ton propre contenu' }, { status: 400 });

  await sql`INSERT INTO signalements (genre, cible, user_id, raison, details) VALUES (${genre}, ${cible}, ${profil.id}, ${corps.raison}, ${details})
    ON CONFLICT (genre, cible, user_id) DO UPDATE SET raison = EXCLUDED.raison, details = EXCLUDED.details, cree_le = now(), traite = false`;
  prevenir('signalements', { postes: ['admin', 'modo'] },
    { titre: 'Contenu signalé', texte: `${GENRES_SIGNALEMENT[genre]} signalé : ${corps.raison}`, lien: '/profil/admin?onglet=signalements' }, profil.id);
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const { profil, erreur } = await exigerPoste('admin', 'modo');
  if (erreur) return erreur;
  const { genre, cible: c, action } = await req.json().catch(() => ({}));
  const cible = String(c || '');
  if (!GENRES_SIGNALEMENT[genre] || !['retirer', 'ignorer'].includes(action)) return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  if (action === 'retirer') {
    if (genre === 'membre') return NextResponse.json({ error: 'Un profil ne se retire pas : avertis ou suspends la personne' }, { status: 400 });
    const auteur = await auteurDe(genre, cible);
    if (auteur && profil.role === 'modo' && ['admin', 'modo'].includes(auteur.role)) {
      return NextResponse.json({ error: 'Tu ne peux pas retirer ce contenu' }, { status: 403 });
    }
    if (genre === 'coloriage' && isId(cible)) await sql`UPDATE pages SET publiee = false WHERE id = ${cible}`;
    if (genre === 'commentaire') await sql`DELETE FROM page_commentaires WHERE id = ${Number(cible) || 0}`;
    if (genre === 'commentaire_missive') await sql`DELETE FROM missive_commentaires WHERE id = ${Number(cible) || 0}`;
    if (genre === 'publication') await sql`DELETE FROM publications WHERE id = ${Number(cible) || 0}`;
    if (genre === 'commentaire_publication') await sql`DELETE FROM publication_commentaires WHERE id = ${Number(cible) || 0}`;
  }
  await sql`UPDATE signalements SET traite = true WHERE genre = ${genre} AND cible = ${cible}`;
  return NextResponse.json({ ok: true });
}
