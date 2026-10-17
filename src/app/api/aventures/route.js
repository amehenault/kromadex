import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { isId } from '@/lib/pages';
import { jourQuebec } from '@/lib/temps';
import { VALEURS_CATEGORIES } from '@/lib/defis';
import { mesTypesVisibles } from '@/lib/visibilite';
import { parcheminsDisponibles } from '@/lib/recompensesServeur';
import { chargerAventure, etatEpopee, soumettre, repondreEnigme } from '@/lib/aventures';

const GENRES = ['expedition', 'epopee', 'prophetie'];
const GENRES_CONTRAINTES = ['obligatoire', 'secondaire', 'facile', 'intermediaire', 'difficile'];
const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);
const entier = (v, min, max, defaut) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : defaut; };

// Ce qu'une personne voit d'une aventure : les contraintes secrètes restent cachées
// (énigme pas résolue, route pas ouverte, étape de prophétie pas encore révélée). La réponse de l'énigme n'est jamais envoyée.
async function vueMembre(a, userId) {
  const aujourdhui = jourQuebec();
  const [inscription] = await sql`SELECT enigme_ok FROM aventure_inscriptions WHERE aventure_id = ${a.id} AND user_id = ${userId}`;
  const mes = await sql`
    SELECT s.etape_id, s.page_id, s.degats, s.contraintes, s.parchemin, to_char(s.jour, 'YYYY-MM-DD') AS jour, OCTET_LENGTH(p.image_b64) AS img_size
    FROM aventure_soumissions s JOIN pages p ON p.id = s.page_id
    WHERE s.aventure_id = ${a.id} AND s.user_id = ${userId} ORDER BY s.cree_le`;
  const epopee = a.genre === 'epopee' ? await etatEpopee(a) : null;
  const etapes = a.etapes.map((e) => {
    let cache = false;
    if (a.genre === 'prophetie' && e.debut && e.debut > aujourdhui) cache = true;
    if (a.genre === 'epopee' && e.ordre === 1 && !inscription?.enigme_ok) cache = true;
    if (a.genre === 'epopee' && e.ordre === 2 && !epopee.routeOuverte) cache = true;
    return cache
      ? { id: e.id, ordre: e.ordre, nom: a.genre === 'prophetie' ? `Étape ${e.ordre}` : e.nom, debut: e.debut, fin: e.fin, cache: true, contraintes: [] }
      : e;
  });
  const { reponse, enigme, ...publique } = a;
  return {
    ...publique,
    enigme: inscription ? enigme : '',
    etapes,
    inscrit: !!inscription,
    enigmeResolue: !!inscription?.enigme_ok,
    mesSoumissions: mes,
    epopee,
    parchemins: await parcheminsDisponibles(userId),
    aujourdhui,
  };
}

// Liste des aventures en cours et récentes, ou une aventure (?id=), ou toutes pour l'admin (?gestion=1)
export async function GET(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const q = new URL(req.url).searchParams;

  if (q.get('gestion') === '1') {
    if (profil.role !== 'admin') return NextResponse.json({ error: 'Accès restreint' }, { status: 403 });
    const ids = await sql`SELECT id FROM aventures ORDER BY debut DESC`;
    const aventures = [];
    for (const { id } of ids) {
      const a = await chargerAventure(id);
      const [s] = await sql`
        SELECT (SELECT count(*)::int FROM aventure_inscriptions WHERE aventure_id = ${id}) AS inscrits,
               (SELECT count(*)::int FROM aventure_soumissions WHERE aventure_id = ${id}) AS soumissions,
               (SELECT count(DISTINCT user_id)::int FROM aventure_soumissions WHERE aventure_id = ${id}) AS personnes`;
      aventures.push({ ...a, stats: s, epopee: a.genre === 'epopee' ? await etatEpopee(a) : null });
    }
    return NextResponse.json({ aventures });
  }

  if (q.get('id')) {
    const a = await chargerAventure(q.get('id'));
    if (!a || (a.debut > jourQuebec() && profil.role !== 'admin')) return NextResponse.json({ error: 'Aventure introuvable' }, { status: 404 });
    return NextResponse.json({ aventure: await vueMembre(a, profil.id) });
  }

  const visibles = await mesTypesVisibles(profil.id);
  const aventures = await sql`
    SELECT a.id, a.genre, a.titre, a.description, a.fete, a.categorie, a.recompense, a.victoire_le,
           to_char(a.debut, 'YYYY-MM-DD') AS debut, to_char(a.fin, 'YYYY-MM-DD') AS fin,
           (((a.fin + 1)::timestamp - interval '1 second') AT TIME ZONE 'America/Toronto') AS fin_instant,
           (a.fin < (now() AT TIME ZONE 'America/Toronto')::date) AS terminee,
           EXISTS (SELECT 1 FROM aventure_inscriptions i WHERE i.aventure_id = a.id AND i.user_id = ${profil.id}) AS inscrit,
           (SELECT count(*)::int FROM aventure_soumissions s WHERE s.aventure_id = a.id AND s.user_id = ${profil.id}) AS mes_soumissions
    FROM aventures a
    WHERE (a.categorie = 'tous' OR a.categorie = ANY(${visibles}))
      AND a.debut <= (now() AT TIME ZONE 'America/Toronto')::date
      AND a.fin >= (now() AT TIME ZONE 'America/Toronto')::date - 30
    ORDER BY (a.fin < (now() AT TIME ZONE 'America/Toronto')::date), a.fin`;
  return NextResponse.json({ aventures, parchemins: await parcheminsDisponibles(profil.id) });
}

// Membres : inscrire (épopée), enigme, soumettre. Admin : enregistrer une aventure et ses étapes.
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  const b = await req.json().catch(() => ({}));
  const non = (message, status = 400) => NextResponse.json({ error: message }, { status });

  if (b.action && b.action !== 'enregistrer') {
    const a = await chargerAventure(b.id);
    if (!a || a.debut > jourQuebec()) return non('Aventure introuvable', 404);
    if (b.action === 'inscrire') {
      if (a.genre !== 'epopee') return non('Pas d’inscription pour cette aventure');
      if (a.fin < jourQuebec()) return non('Cette épopée est terminée');
      await sql`INSERT INTO aventure_inscriptions (aventure_id, user_id) VALUES (${a.id}, ${profil.id}) ON CONFLICT DO NOTHING`;
      return NextResponse.json({ ok: true });
    }
    if (b.action === 'enigme') {
      const r = await repondreEnigme(a, profil.id, b.reponse);
      return r.erreur ? non(r.erreur) : NextResponse.json({ ok: true });
    }
    if (b.action === 'soumettre') {
      if (!isId(String(b.pageId || ''))) return non('Choisis un coloriage');
      const r = await soumettre(a, profil.id, b);
      return r.erreur ? non(r.erreur) : NextResponse.json(r);
    }
    return non('Action inconnue');
  }

  // Enregistrer une aventure (admin)
  if (profil.role !== 'admin') return non('Réservé à l’Invocatrice', 403);
  const genre = GENRES.includes(b.genre) ? b.genre : null;
  const titre = String(b.titre || '').trim().slice(0, 100);
  const debut = date(b.debut), fin = date(b.fin);
  if (!genre || !titre) return non('Choisis le type d’aventure et son titre');
  if (!debut || !fin || fin < debut) return non('Vérifie les dates de début et de fin');
  const etapes = (Array.isArray(b.etapes) ? b.etapes : []).slice(0, 12);
  if (!etapes.length) return non('Ajoute au moins une étape');
  if (genre === 'epopee' && etapes.length !== 2) return non('Une épopée a deux phases : ouvrir la route, puis affronter le dragon');
  if (genre === 'epopee' && !String(b.enigme || '').trim()) return non('Écris l’énigme de la phase 1 et sa réponse');
  if (genre === 'prophetie') {
    const [autre] = await sql`SELECT 1 FROM aventures WHERE genre = 'prophetie' AND extract(year FROM debut) = extract(year FROM ${debut}::date) AND id <> ${Number(b.id) || 0}`;
    if (autre) return non('Il y a déjà une prophétie cette année');
  }
  const xp = {};
  for (const [cle, v] of Object.entries(b.xp || {})) if (Number.isFinite(Number(v))) xp[cle] = entier(v, 0, 5000, 0);

  const champs = {
    titre, description: String(b.description || '').slice(0, 2000), fete: String(b.fete || '').slice(0, 30),
    categorie: VALEURS_CATEGORIES.includes(b.categorie) ? b.categorie : 'tous',
    enigme: String(b.enigme || '').slice(0, 1000), reponse: String(b.reponse || '').slice(0, 200),
    pv: entier(b.pv, 1, 1000000, 12000), min_contributions: entier(b.min_contributions, 1, 100, 6), min_attaques: entier(b.min_attaques, 1, 1000, 12),
    recompense: String(b.recompense || '').trim().slice(0, 80), image: String(b.image || '').trim().slice(0, 120),
  };
  let id = Number(b.id) || null;
  if (id) {
    await sql`UPDATE aventures SET genre = ${genre}, titre = ${champs.titre}, description = ${champs.description}, fete = ${champs.fete},
      categorie = ${champs.categorie}, debut = ${debut}, fin = ${fin}, enigme = ${champs.enigme}, reponse = ${champs.reponse}, pv = ${champs.pv},
      min_contributions = ${champs.min_contributions}, min_attaques = ${champs.min_attaques}, xp = ${JSON.stringify(xp)}::jsonb,
      recompense = ${champs.recompense}, image = ${champs.image} WHERE id = ${id}`;
  } else {
    const [a] = await sql`
      INSERT INTO aventures (genre, titre, description, fete, categorie, debut, fin, enigme, reponse, pv, min_contributions, min_attaques, xp, recompense, image)
      VALUES (${genre}, ${champs.titre}, ${champs.description}, ${champs.fete}, ${champs.categorie}, ${debut}, ${fin}, ${champs.enigme}, ${champs.reponse},
              ${champs.pv}, ${champs.min_contributions}, ${champs.min_attaques}, ${JSON.stringify(xp)}::jsonb, ${champs.recompense}, ${champs.image})
      RETURNING id`;
    id = a.id;
  }

  // Étapes et contraintes : mises à jour, ajoutées ou retirées (une étape qui a déjà des soumissions ne peut pas être retirée)
  const gardees = [];
  for (const [i, e] of etapes.entries()) {
    const nom = String(e.nom || '').trim().slice(0, 100) || `Étape ${i + 1}`;
    const valeurs = [nom, String(e.instructions || '').slice(0, 2000), entier(e.xp, 0, 5000, 0), date(e.debut), date(e.fin)];
    let etapeId = Number(e.id) || null;
    if (etapeId) {
      const maj = await sql`UPDATE aventure_etapes SET ordre = ${i + 1}, nom = ${valeurs[0]}, instructions = ${valeurs[1]}, xp = ${valeurs[2]},
        debut = ${valeurs[3]}, fin = ${valeurs[4]} WHERE id = ${etapeId} AND aventure_id = ${id} RETURNING id`;
      if (!maj.length) etapeId = null;
    }
    if (!etapeId) {
      const [n] = await sql`INSERT INTO aventure_etapes (aventure_id, ordre, nom, instructions, xp, debut, fin)
        VALUES (${id}, ${i + 1}, ${valeurs[0]}, ${valeurs[1]}, ${valeurs[2]}, ${valeurs[3]}, ${valeurs[4]}) RETURNING id`;
      etapeId = n.id;
    }
    gardees.push(etapeId);
    const contraintesGardees = [];
    for (const [j, c] of (Array.isArray(e.contraintes) ? e.contraintes : []).slice(0, 20).entries()) {
      const texte = String(c.texte || '').trim().slice(0, 300);
      if (!texte) continue;
      const g = GENRES_CONTRAINTES.includes(c.genre) ? c.genre : 'obligatoire';
      const degats = entier(c.degats, 0, 100000, 0), xpC = entier(c.xp, 0, 5000, 0);
      let cid = Number(c.id) || null;
      if (cid) {
        const maj = await sql`UPDATE aventure_contraintes SET ordre = ${j}, texte = ${texte}, genre = ${g}, degats = ${degats}, xp = ${xpC}
          WHERE id = ${cid} AND etape_id = ${etapeId} RETURNING id`;
        if (!maj.length) cid = null;
      }
      if (!cid) {
        const [n] = await sql`INSERT INTO aventure_contraintes (etape_id, ordre, texte, genre, degats, xp)
          VALUES (${etapeId}, ${j}, ${texte}, ${g}, ${degats}, ${xpC}) RETURNING id`;
        cid = n.id;
      }
      contraintesGardees.push(cid);
    }
    await sql`DELETE FROM aventure_contraintes WHERE etape_id = ${etapeId} AND NOT (id = ANY(${contraintesGardees}))`;
  }
  const [utilisee] = await sql`SELECT 1 FROM aventure_soumissions WHERE aventure_id = ${id} AND NOT (etape_id = ANY(${gardees}))`;
  if (utilisee) return non('Une étape retirée a déjà des soumissions : elle a été gardée', 409);
  await sql`DELETE FROM aventure_etapes WHERE aventure_id = ${id} AND NOT (id = ANY(${gardees}))`;
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req) {
  const { erreur } = await exigerPoste('admin');
  if (erreur) return erreur;
  const { id } = await req.json().catch(() => ({}));
  await sql`DELETE FROM aventures WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
