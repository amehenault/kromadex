import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { isId } from '@/lib/pages';
import { mesTypesVisibles } from '@/lib/visibilite';
import { imageDuFormulaire, ErreurImage, reponseErreurImage, COTE } from '@/lib/images';
import { GENRES_PUBLICATION, MAX_IMAGES_PUBLICATION, MAX_TEXTE_PUBLICATION, MAX_PUBLICATIONS_JOUR } from '@/lib/publications';

export const dynamic = 'force-dynamic';

const dateValide = (v) => (v && !isNaN(Date.parse(v)) ? v : null);

// Publications de la communauté (questions, coloriages en cours), membres connectés seulement.
//  ?genre=question|en_cours&avant=  : les publications de ce genre (20 à la fois)
//  ?vue=fil&avant=&suivis=1         : fil d'actualités, publications et coloriages publiés mélangés, du plus récent au plus ancien
//  ?id=12                           : une publication
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const q = new URL(req.url).searchParams;
  const moi = profil.id;
  const avant = dateValide(q.get('avant'));
  const suivis = q.get('suivis') === '1';
  const id = Number(q.get('id')) || null;
  const genre = GENRES_PUBLICATION[q.get('genre')] ? q.get('genre') : null;

  const publications = await sql`
    SELECT 'publication' AS sorte, p.id, p.genre, p.texte, p.cree_le AS date, p.page_id, pg.title, pg.tome, pg.page_no,
           (SELECT count(*)::int FROM publication_images i WHERE i.publication_id = p.id) AS nb_images,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM publication_likes l WHERE l.publication_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM publication_likes l WHERE l.publication_id = p.id AND l.user_id = ${moi}) AS aime,
           (SELECT count(*)::int FROM publication_commentaires c WHERE c.publication_id = p.id) AS nb_commentaires,
           (p.user_id = ${moi}) AS mienne, ${['admin', 'modo'].includes(profil.role)} AS peut_retirer
    FROM publications p JOIN users u ON u.id = p.user_id LEFT JOIN pages pg ON pg.id = p.page_id
    WHERE (${id}::int IS NULL OR p.id = ${id})
      AND (${genre}::text IS NULL OR p.genre = ${genre})
      AND (${avant}::timestamptz IS NULL OR p.cree_le < ${avant}::timestamptz)
      AND (${suivis}::boolean IS NOT TRUE OR p.user_id IN (SELECT suivi FROM abonnements WHERE suiveur = ${moi}))
    ORDER BY p.cree_le DESC LIMIT 20`;
  if (id) {
    if (!publications.length) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    return NextResponse.json({ publication: publications[0] });
  }
  if (q.get('vue') !== 'fil') return NextResponse.json({ publications });

  // Fil d'actualités : on ajoute les coloriages publiés (des types que la personne veut voir) et on garde les 20 plus récents
  const visibles = await mesTypesVisibles(moi);
  const coloriages = await sql`
    SELECT 'coloriage' AS sorte, p.id, p.title, p.tome, p.page_no, p.type_coloriage, p.publiee_le AS date, OCTET_LENGTH(p.image_b64) AS img_size,
           u.id AS auteur_id, u.pseudo, u.name, u.role, (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM page_likes l WHERE l.page_id = p.id) AS likes,
           EXISTS (SELECT 1 FROM page_likes l WHERE l.page_id = p.id AND l.user_id = ${moi}) AS aime
    FROM pages p JOIN users u ON u.id = p.user_id
    WHERE p.publiee AND p.type_coloriage = ANY(${visibles})
      AND (${avant}::timestamptz IS NULL OR p.publiee_le < ${avant}::timestamptz)
      AND (${suivis}::boolean IS NOT TRUE OR p.user_id IN (SELECT suivi FROM abonnements WHERE suiveur = ${moi}))
    ORDER BY p.publiee_le DESC LIMIT 20`;
  const fil = [...publications, ...coloriages].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  return NextResponse.json({ fil });
}

// Publier (formulaire : genre, texte, page_id facultatif, images 1 à 4), ou aimer / ne plus aimer ({ like: id })
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;

  if ((req.headers.get('content-type') || '').includes('application/json')) {
    const { like } = await req.json().catch(() => ({}));
    const id = Number(like) || 0;
    if (!(await sql`SELECT 1 FROM publications WHERE id = ${id}`).length) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    const retire = await sql`DELETE FROM publication_likes WHERE user_id = ${profil.id} AND publication_id = ${id} RETURNING 1`;
    if (!retire.length) await sql`INSERT INTO publication_likes (user_id, publication_id) VALUES (${profil.id}, ${id}) ON CONFLICT DO NOTHING`;
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM publication_likes WHERE publication_id = ${id}`;
    return NextResponse.json({ aime: !retire.length, likes: n });
  }

  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
  const genre = String(f.get('genre') || '');
  if (!GENRES_PUBLICATION[genre]) return NextResponse.json({ error: 'Choisis une section' }, { status: 400 });
  const texte = String(f.get('texte') || '').trim().slice(0, MAX_TEXTE_PUBLICATION);
  const fichiers = f.getAll('images').filter((x) => typeof x === 'object' && x.size);
  if (fichiers.length > MAX_IMAGES_PUBLICATION) return NextResponse.json({ error: `${MAX_IMAGES_PUBLICATION} images au maximum` }, { status: 400 });

  // Coloriage en cours choisi dans ses coloriages : on reprend sa photo (le coloriage lui-même reste privé)
  const pageId = String(f.get('page_id') || '');
  let page = null;
  if (pageId) {
    if (genre !== 'en_cours' || !isId(pageId)) return NextResponse.json({ error: 'Coloriage invalide' }, { status: 400 });
    [page] = await sql`SELECT id, image_b64, image_type FROM pages WHERE id = ${pageId} AND user_id = ${profil.id} AND image_b64 IS NOT NULL`;
    if (!page) return NextResponse.json({ error: 'Coloriage introuvable' }, { status: 404 });
  }
  if (genre === 'question' && texte.length < 3) return NextResponse.json({ error: 'Écris ta question' }, { status: 400 });
  if (genre === 'en_cours' && !page && !fichiers.length) return NextResponse.json({ error: 'Ajoute une photo de ton coloriage' }, { status: 400 });

  const [{ n }] = await sql`SELECT count(*)::int AS n FROM publications WHERE user_id = ${profil.id} AND cree_le > now() - interval '1 day'`;
  if (n >= MAX_PUBLICATIONS_JOUR) return NextResponse.json({ error: 'Tu as déjà beaucoup publié aujourd’hui, réessaie demain.' }, { status: 429 });

  // Images vérifiées et réencodées (métadonnées retirées) avant d'enregistrer quoi que ce soit
  let images;
  try { images = await Promise.all(fichiers.map((x) => imageDuFormulaire(x, { coteMax: COTE.coloriage }))); }
  catch (e) { if (e instanceof ErreurImage) return reponseErreurImage(e); throw e; }
  if (page) images.unshift({ b64: page.image_b64, type: page.image_type || 'image/webp' });

  // Une seule transaction : la publication et ses images sont enregistrées ensemble, ou pas du tout
  const [[p]] = await sql.transaction([
    sql`INSERT INTO publications (user_id, genre, texte, page_id) VALUES (${profil.id}, ${genre}, ${texte}, ${page?.id || null}) RETURNING id`,
    ...images.slice(0, MAX_IMAGES_PUBLICATION).map((img, i) => sql`INSERT INTO publication_images (publication_id, no, image_b64, type)
      VALUES (currval(pg_get_serial_sequence('publications', 'id')), ${i}, ${img.b64}, ${img.type})`),
  ]);
  return NextResponse.json({ ok: true, id: p.id });
}

// Retirer une publication : la sienne, ou n'importe laquelle pour l'admin et les Sentinelles
export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  const n = Number(id) || 0;
  const retire = ['admin', 'modo'].includes(profil.role)
    ? await sql`DELETE FROM publications WHERE id = ${n} RETURNING id`
    : await sql`DELETE FROM publications WHERE id = ${n} AND user_id = ${profil.id} RETURNING id`;
  if (!retire.length) return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 });
  await sql`DELETE FROM signalements WHERE genre = 'publication' AND cible = ${String(n)}`;
  return NextResponse.json({ ok: true });
}
