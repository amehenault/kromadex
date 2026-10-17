import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { exigerPoste } from '@/lib/roles';
import { isId } from '@/lib/pages';
import { VALEURS_CATEGORIES, pageConvient } from '@/lib/defis';
import { TOURNOIS, GENRES_TOURNOI } from '@/lib/activites';
import { avancerTournois, demarrerTournoi, peutCreerTournoi } from '@/lib/tournois';

// Tournois en inscription, en cours, et terminés depuis moins de 30 jours.
// Pour chaque tournoi : ma participation et mon duo de la ronde en cours (sans le nom de l'adversaire).
export async function GET() {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  await avancerTournois();
  const tournois = await sql`
    SELECT t.id, t.genre, t.titre, t.theme, t.categorie, t.statut, t.inscriptions_fin, t.prolonge, t.taille, t.ronde, t.termine_le, t.cree_le,
           t.createur = ${profil.id} AS je_cree,
           (SELECT count(*)::int FROM tournoi_inscrits i WHERE i.tournoi_id = t.id) AS inscrits,
           EXISTS (SELECT 1 FROM tournoi_inscrits i WHERE i.tournoi_id = t.id AND i.user_id = ${profil.id}) AS inscrit,
           CASE WHEN t.statut = 'termine' THEN (SELECT COALESCE('@' || pseudo, name) FROM users WHERE id = t.gagnant) END AS nom_gagnant,
           t.gagnant = ${profil.id} AS j_ai_gagne,
           (SELECT json_agg(json_build_object('id', m.id, 'ordre', m.ordre, 'soumission_fin', m.soumission_fin, 'verdict_fin', m.verdict_fin,
                                              'decide', m.gagnant IS NOT NULL, 'complet', m.page_a IS NOT NULL AND m.page_b IS NOT NULL) ORDER BY m.ordre)
            FROM tournoi_matchs m WHERE m.tournoi_id = t.id AND m.ronde = t.ronde) AS matchs,
           (SELECT json_build_object('id', m.id, 'soumission_fin', m.soumission_fin, 'verdict_fin', m.verdict_fin,
                                     'ma_page', CASE WHEN m.joueur_a = ${profil.id} THEN m.page_a ELSE m.page_b END,
                                     'adversaire_soumis', CASE WHEN m.joueur_a = ${profil.id} THEN m.page_b IS NOT NULL ELSE m.page_a IS NOT NULL END,
                                     'decide', m.gagnant IS NOT NULL, 'gagne', m.gagnant = ${profil.id})
            FROM tournoi_matchs m WHERE m.tournoi_id = t.id AND m.ronde = t.ronde AND ${profil.id} IN (m.joueur_a, m.joueur_b)) AS mon_match,
           NOT EXISTS (SELECT 1 FROM tournoi_matchs m WHERE m.tournoi_id = t.id AND m.gagnant IS NOT NULL AND m.gagnant <> ${profil.id}
                       AND ${profil.id} IN (m.joueur_a, m.joueur_b)) AS encore_en_lice
    FROM tournois t
    WHERE t.statut IN ('inscriptions', 'en_cours') OR t.termine_le > now() - interval '30 days'
    ORDER BY t.cree_le DESC LIMIT 20`;
  const creation = ['admin', 'modo'].includes(profil.role) ? await peutCreerTournoi() : null;
  return NextResponse.json({ tournois, creation });
}

// Actions : creer (sentinelles et admin), annuler, inscrire, desinscrire, soumettre
export async function POST(req) {
  const { profil, erreur } = await exigerPoste();
  if (erreur) return erreur;
  await avancerTournois();
  const b = await req.json().catch(() => ({}));
  const moi = profil.id;
  const non = (message, status = 400) => NextResponse.json({ error: message }, { status });

  if (b.action === 'creer') {
    if (!['admin', 'modo'].includes(profil.role)) return non('Réservé aux sentinelles et à l’Invocatrice', 403);
    const possible = await peutCreerTournoi();
    if (!possible.ok) return non(possible.raison, 409);
    const genre = GENRES_TOURNOI.some((g) => g.valeur === b.genre) ? b.genre : null;
    const titre = String(b.titre || '').trim().slice(0, 100);
    if (!genre || !titre) return non('Choisis le type de tournoi et son nom');
    const categorie = VALEURS_CATEGORIES.includes(b.categorie) ? b.categorie : 'tous';
    await sql`
      INSERT INTO tournois (genre, titre, theme, categorie, createur, inscriptions_fin)
      VALUES (${genre}, ${titre}, ${String(b.theme || '').trim().slice(0, 200)}, ${categorie}, ${moi},
              now() + make_interval(days => ${TOURNOIS.joursInscription}))`;
    return NextResponse.json({ ok: true });
  }

  const [t] = await sql`SELECT * FROM tournois WHERE id = ${Number(b.id)}`;
  if (!t) return non('Tournoi introuvable', 404);

  if (b.action === 'annuler') {
    if (t.statut !== 'inscriptions' || !(String(t.createur) === String(moi) || profil.role === 'admin')) return non('Impossible', 403);
    await sql`UPDATE tournois SET statut = 'annule', termine_le = now() WHERE id = ${t.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'inscrire') {
    if (t.statut !== 'inscriptions') return non('Les inscriptions sont fermées', 403);
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM tournoi_inscrits WHERE tournoi_id = ${t.id}`;
    if (n >= TOURNOIS.tailles.at(-1)) return non('Le tournoi est complet', 409);
    await sql`INSERT INTO tournoi_inscrits (tournoi_id, user_id) VALUES (${t.id}, ${moi}) ON CONFLICT DO NOTHING`;
    // Complet : le tournoi commence tout de suite
    if (n + 1 >= TOURNOIS.tailles.at(-1)) await demarrerTournoi(t.id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'desinscrire') {
    if (t.statut !== 'inscriptions') return non('Le tournoi a commencé', 403);
    await sql`DELETE FROM tournoi_inscrits WHERE tournoi_id = ${t.id} AND user_id = ${moi}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'soumettre') {
    const [m] = await sql`
      SELECT * FROM tournoi_matchs WHERE id = ${Number(b.matchId)} AND tournoi_id = ${t.id} AND ronde = ${t.ronde}
        AND gagnant IS NULL AND soumission_fin > now() AND ${moi} IN (joueur_a, joueur_b)`;
    if (!m) return non('La période de soumission de cette ronde est terminée', 403);
    if (!isId(String(b.pageId || ''))) return non('Choisis un coloriage');
    const [p] = await sql`SELECT id, COALESCE(NULLIF(type_coloriage, ''), (SELECT c.type FROM tome_catalog c WHERE lower(c.nom) = lower(tome) LIMIT 1), '') AS type_coloriage FROM pages WHERE id = ${b.pageId} AND user_id = ${moi} AND image_b64 IS NOT NULL`;
    if (!p || !pageConvient(t.categorie, p.type_coloriage)) return non('Choisis un de tes coloriages du bon type');
    const [deja] = await sql`SELECT 1 FROM tournoi_matchs WHERE tournoi_id = ${t.id} AND id <> ${m.id} AND ${p.id} IN (page_a, page_b)`;
    if (deja) return non('Ce coloriage a déjà servi dans ce tournoi : choisis-en un nouveau pour chaque ronde');
    if (String(m.joueur_a) === String(moi)) await sql`UPDATE tournoi_matchs SET page_a = ${p.id}, soumis_a = now() WHERE id = ${m.id}`;
    else await sql`UPDATE tournoi_matchs SET page_b = ${p.id}, soumis_b = now() WHERE id = ${m.id}`;
    return NextResponse.json({ ok: true });
  }
  return non('Action inconnue');
}
