import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { jourQuebec, premierDuMoisQuebec as premierDuMois, finDuMois } from '@/lib/temps';
import { VALEURS_CATEGORIES } from '@/lib/defis';
import { mesTypesVisibles } from '@/lib/visibilite';
import { cloturerEpreuves } from '@/lib/clotures';
import { ajouterJours } from '@/lib/temps';
import { verifierLimite } from '@/lib/abonnement';

const veilleFinDuMois = (iso) => ajouterJours(finDuMois(iso), -1);
const reglages = (c) => ({
  titreGagnant: String(c.titre_gagnant || '').trim().slice(0, 60),
  image: String(c.image || '').trim().slice(0, 120),
  sceau: Math.max(1, Math.min(6, parseInt(c.sceau, 10) || 1)),
});

const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);
const aujourdhui = () => jourQuebec();

async function delaiCheffe(userId) {
  const [u] = await sql`
    SELECT COALESCE(cheffe_depuis, cheffe_expires_at - interval '1 month') AS depuis,
           to_char(cheffe_expires_at, 'YYYY-MM-DD') AS fin_mandat
    FROM users WHERE id = ${userId} AND role = 'cheffe'`;
  if (!u?.depuis) return { ouvert: false, deja: false, limite: null, finMandat: null };
  const limite = new Date(new Date(u.depuis).getTime() + 7 * 86400000);
  const [d] = await sql`SELECT 1 FROM defis WHERE genre = 'cheffe' AND choisi_par = ${userId} AND cree_le >= ${u.depuis}`;
  return { ouvert: Date.now() <= limite.getTime(), deja: !!d, limite: limite.toISOString(), finMandat: u.fin_mandat };
}

export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const gestion = new URL(req.url).searchParams.get('gestion') === '1';
  await cloturerEpreuves();
  const visibles = await mesTypesVisibles(profil.id);
  const defis = await sql`
    SELECT d.id, d.genre, d.categorie, to_char(d.mois, 'YYYY-MM-DD') AS mois, d.titre, d.description,
           to_char(d.debut, 'YYYY-MM-DD') AS debut, to_char(d.fin, 'YYYY-MM-DD') AS fin,
           (((d.fin + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin_instant,
           (d.debut > (now() AT TIME ZONE 'America/Toronto')::date) AS programme,
           d.choisi_par AS createur_id, u.pseudo AS choisi_par, u.name AS nom_createur, u.role AS role_createur, u.genre AS genre_createur,
           (u.avatar_b64 IS NOT NULL) AS a_avatar, u.avatar_maj,
           (SELECT count(*)::int FROM defi_participations p WHERE p.defi_id = d.id) AS participants,
           (SELECT count(*)::int FROM defi_participations p WHERE p.defi_id = d.id AND p.page_id IS NOT NULL) AS coloriages,
           mp.cree_le IS NOT NULL AS je_participe, mp.page_id AS ma_page,
           d.titre_gagnant, d.image, d.sceau, d.objectif, d.multiple, d.cloture,
           CASE WHEN d.cloture THEN (SELECT COALESCE('@' || g.pseudo, g.name) FROM users g WHERE g.id = d.gagnant) END AS nom_gagnant,
           d.gagnant = ${profil.id} AS j_ai_gagne,
           (SELECT count(*)::int FROM defi_envois e WHERE e.defi_id = d.id) AS envois,
           (SELECT count(*)::int FROM defi_envois e WHERE e.defi_id = d.id AND e.user_id = ${profil.id}) AS mes_envois
    FROM defis d
    LEFT JOIN users u ON u.id = d.choisi_par
    LEFT JOIN defi_participations mp ON mp.defi_id = d.id AND mp.user_id = ${profil.id}
    WHERE (${gestion} AND d.genre <> 'groupe')
       OR (NOT ${gestion}
           AND (d.categorie = 'tous' OR d.categorie = ANY(${visibles}))
           AND d.debut <= (now() AT TIME ZONE 'America/Toronto')::date
           AND (
             d.fin >= (now() AT TIME ZONE 'America/Toronto')::date - 7
           ))
    ORDER BY array_position(ARRAY['officiel', 'modo', 'cheffe', 'menestrel', 'groupe'], d.genre), d.debut DESC
    LIMIT 200`;
  const cheffe = profil.role === 'cheffe' ? await delaiCheffe(profil.id) : null;
  return NextResponse.json({ defis, moisActuel: premierDuMois(0), moisProchain: premierDuMois(1), aujourdhui: aujourdhui(), cheffe });
}

export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const c = await req.json().catch(() => ({}));
  const genre = c.genre || 'officiel';
  const titre = String(c.titre || '').trim().slice(0, 100);
  const description = String(c.description || '').slice(0, 1000);
  const categorie = VALEURS_CATEGORIES.includes(c.categorie) ? c.categorie : 'tous';
  if (!titre) return NextResponse.json({ error: 'Le thème de l’épreuve est requis' }, { status: 400 });
  const ajd = aujourdhui();
  const { titreGagnant, image, sceau } = reglages(c);

  if (genre === 'groupe') {
    const fin = date(c.fin);
    if (!fin || fin < ajd) return NextResponse.json({ error: 'Choisis une date de fin à partir d’aujourd’hui' }, { status: 400 });
    const objectif = parseInt(c.objectif, 10);
    if (!(objectif >= 1 && objectif <= 10000)) return NextResponse.json({ error: 'Indique l’objectif : combien de coloriages en tout pour réussir l’épreuve' }, { status: 400 });
    const multiple = c.multiple === true;
    if (c.id) {
      const maj = await sql`UPDATE defis SET titre = ${titre}, description = ${description}, categorie = ${categorie}, fin = ${fin},
          objectif = ${objectif}, multiple = ${multiple}
        WHERE id = ${Number(c.id)} AND genre = 'groupe' AND choisi_par = ${profil.id} RETURNING id`;
      if (!maj.length) return NextResponse.json({ error: 'Tu ne peux modifier que tes épreuves de groupe' }, { status: 403 });
      return NextResponse.json({ ok: true });
    }
    const limite = await verifierLimite(profil.id, 'epreuvesGroupe');
    if (limite) return limite;
    const cree = await sql`INSERT INTO defis (genre, mois, titre, description, categorie, debut, fin, choisi_par, objectif, multiple)
      VALUES ('groupe', date_trunc('month', ${ajd}::date), ${titre}, ${description}, ${categorie}, ${ajd}, ${fin}, ${profil.id}, ${objectif}, ${multiple})
      RETURNING id`;
    await sql`INSERT INTO defi_participations (defi_id, user_id) VALUES (${cree[0].id}, ${profil.id}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true, id: cree[0].id });
  }

  if (genre === 'modo' || genre === 'menestrel') {
    if (profil.role !== genre) return NextResponse.json({ error: genre === 'modo' ? 'Réservé aux sentinelles' : 'Réservé aux ménestrelles' }, { status: 403 });
    const premiersJours = Number(ajd.slice(8, 10)) <= 7;
    const debut = premiersJours && c.depart === 'maintenant' ? ajd : premierDuMois(1);
    const mois = `${debut.slice(0, 7)}-01`;
    if (genre === 'modo') await sql`
      INSERT INTO defis (genre, mois, titre, description, categorie, debut, fin, choisi_par, titre_gagnant, image)
      VALUES ('modo', ${mois}, ${titre}, ${description}, ${categorie}, ${debut}, ${veilleFinDuMois(debut)}, ${profil.id}, ${titreGagnant}, ${image})
      ON CONFLICT (mois, choisi_par) WHERE genre = 'modo'
      DO UPDATE SET titre = EXCLUDED.titre, description = EXCLUDED.description, categorie = EXCLUDED.categorie,
        titre_gagnant = EXCLUDED.titre_gagnant, image = EXCLUDED.image`;
    else await sql`
      INSERT INTO defis (genre, mois, titre, description, categorie, debut, fin, choisi_par, titre_gagnant, image)
      VALUES ('menestrel', ${mois}, ${titre}, ${description}, ${categorie}, ${debut}, ${veilleFinDuMois(debut)}, ${profil.id}, ${titreGagnant}, ${image})
      ON CONFLICT (mois, choisi_par) WHERE genre = 'menestrel'
      DO UPDATE SET titre = EXCLUDED.titre, description = EXCLUDED.description, categorie = EXCLUDED.categorie,
        titre_gagnant = EXCLUDED.titre_gagnant, image = EXCLUDED.image`;
    return NextResponse.json({ ok: true, debut });
  }

  if (genre === 'cheffe') {
    if (profil.role !== 'cheffe') return NextResponse.json({ error: 'Réservé aux cheffes' }, { status: 403 });
    const delai = await delaiCheffe(profil.id);
    if (c.id) {
      const maj = await sql`UPDATE defis SET titre = ${titre}, description = ${description}, categorie = ${categorie},
          titre_gagnant = ${titreGagnant}, sceau = ${sceau}
        WHERE id = ${Number(c.id)} AND genre = 'cheffe' AND choisi_par = ${profil.id} RETURNING id`;
      if (!maj.length) return NextResponse.json({ error: 'Tu ne peux modifier que ton épreuve de cheffe' }, { status: 403 });
      return NextResponse.json({ ok: true });
    }
    if (delai.deja) return NextResponse.json({ error: 'Tu as déjà créé ton épreuve de cheffe pour ce mandat' }, { status: 409 });
    if (!delai.ouvert) return NextResponse.json({ error: 'Le délai de 7 jours après ta nomination est passé : tu ne peux plus créer d’épreuve de cheffe' }, { status: 403 });
    const fin = delai.finMandat && delai.finMandat > ajd ? ajouterJours(delai.finMandat, -1) : veilleFinDuMois(ajd);
    const cree = await sql`
      INSERT INTO defis (genre, mois, titre, description, categorie, debut, fin, choisi_par, titre_gagnant, sceau)
      VALUES ('cheffe', date_trunc('month', ${ajd}::date), ${titre}, ${description}, ${categorie}, ${ajd}, ${fin}, ${profil.id}, ${titreGagnant}, ${sceau})
      ON CONFLICT (mois, choisi_par) WHERE genre = 'cheffe' DO NOTHING RETURNING id`;
    if (!cree.length) return NextResponse.json({ error: 'Tu as déjà une épreuve de cheffe ce mois-ci' }, { status: 409 });
    return NextResponse.json({ ok: true, debut: ajd });
  }

  if (profil.role !== 'admin') return NextResponse.json({ error: 'Réservé à l’admin' }, { status: 403 });
  const debut = date(c.debut);
  if (!debut) return NextResponse.json({ error: 'Choisis la date de début' }, { status: 400 });
  const fin = date(c.fin) || veilleFinDuMois(debut);
  if (fin < debut) return NextResponse.json({ error: 'La fin doit être après le début' }, { status: 400 });
  const mois = `${debut.slice(0, 7)}-01`;
  if (c.id) {
    const maj = await sql`UPDATE defis SET titre = ${titre}, description = ${description}, categorie = ${categorie},
        debut = ${debut}, fin = ${fin}, mois = ${mois}, titre_gagnant = ${titreGagnant}, image = ${image}
      WHERE id = ${Number(c.id)} AND genre = 'officiel' RETURNING id`.catch(() => null);
    if (!maj) return NextResponse.json({ error: 'Il y a déjà une épreuve officielle ce mois-là' }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  const cree = await sql`
    INSERT INTO defis (genre, mois, titre, description, categorie, debut, fin, choisi_par, titre_gagnant, image)
    VALUES ('officiel', ${mois}, ${titre}, ${description}, ${categorie}, ${debut}, ${fin}, ${profil.id}, ${titreGagnant}, ${image})
    ON CONFLICT (mois) WHERE genre = 'officiel' DO NOTHING RETURNING id`;
  if (!cree.length) return NextResponse.json({ error: 'Il y a déjà une épreuve officielle ce mois-là' }, { status: 409 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  if (profil.role === 'admin') await sql`DELETE FROM defis WHERE id = ${Number(id)}`;
  else await sql`DELETE FROM defis WHERE id = ${Number(id)} AND genre IN ('modo', 'cheffe', 'menestrel', 'groupe') AND choisi_par = ${profil.id}`;
  return NextResponse.json({ ok: true });
}
