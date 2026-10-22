import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser, verifyPassword, destroySession } from '@/lib/auth';
import { createHash } from 'node:crypto';

export const dynamic = 'force-dynamic';

// Supprimer son compte (mot de passe exigé). Inventaire complet : docs/confidentialite.md.
// La plupart des tables s'effacent avec le compte (ON DELETE CASCADE) ; les autres sont traitées ici :
// les données personnelles sont supprimées, et ce qui touche d'autres membres (épreuves créées, missives,
// gagnants passés, mots-clefs proposés, tournois créés) garde son contenu mais perd le lien vers la personne.
export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { motDePasse } = await req.json().catch(() => ({}));

  const [u] = await sql`SELECT role, password_hash, plus_statut, plus_jusqu, email, pseudo, name FROM users WHERE id = ${user.id}`;
  if (!u || !verifyPassword(String(motDePasse || ''), u.password_hash)) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 });
  }
  if (u.role === 'admin') {
    return NextResponse.json({ error: 'Le compte de l’Invocatrice ne peut pas être supprimé.' }, { status: 403 });
  }
  // Un abonnement payé doit d'abord être annulé chez ThriveCart, sinon les prélèvements continueraient.
  // Un abonnement déjà annulé (plus_statut « annule ») mais encore utilisable jusqu'à son échéance ne bloque pas.
  if (u.plus_statut === 'actif' && u.plus_jusqu && new Date(u.plus_jusqu) > new Date()) {
    return NextResponse.json({ error: 'Annule d’abord ton abonnement Kromadex+ (Paramètres > Kromadex+ et mon abonnement), puis reviens supprimer ton compte.' }, { status: 409 });
  }

  const id = user.id;
  const texte = String(id);
  const courriel = String(u.email || '').toLowerCase();
  const emailH = createHash('sha256').update(courriel).digest('hex');
  // Façons dont la personne est nommée dans les sceaux gagnés par d'autres (« de @pseudo » ou « de Nom »)
  const nomsSceau = [u.pseudo && `de @${u.pseudo}`, u.name && `de ${u.name}`].filter(Boolean);
  // Une seule transaction : si une étape échoue, rien n'est supprimé (pas de suppression à moitié faite)
  await sql.transaction([
    // Traces qui désignent la personne ou son contenu sans lien automatique : vues de son profil et de ses fiches,
    // signalements de son profil, de ses coloriages et de ses commentaires
    sql`DELETE FROM vues WHERE (genre = 'profil' AND cible = ${texte})
          OR (genre = 'fiche' AND cible IN (SELECT id::text FROM pages WHERE user_id = ${id}))`,
    sql`DELETE FROM signalements WHERE (genre = 'membre' AND cible = ${texte})
          OR (genre = 'coloriage' AND cible IN (SELECT id::text FROM pages WHERE user_id = ${id}))
          OR (genre = 'commentaire' AND cible IN (SELECT id::text FROM page_commentaires WHERE user_id = ${id}))
          OR (genre = 'commentaire_missive' AND cible IN (SELECT id::text FROM missive_commentaires WHERE user_id = ${id}))
          OR (genre = 'publication' AND cible IN (SELECT id::text FROM publications WHERE user_id = ${id}))
          OR (genre = 'commentaire_publication' AND cible IN (SELECT id::text FROM publication_commentaires WHERE user_id = ${id}))`,
    // Tentatives de connexion avec son courriel (empreinte)
    sql`DELETE FROM essais_limites WHERE email_h = ${emailH}`,
    // Paiements : le journal des avis (courriel, montant…) est effacé ; la clé anti-doublon reste, sans lien avec la personne
    sql`DELETE FROM paiements_evenements WHERE user_id = ${id} OR (courriel <> '' AND lower(courriel) = ${courriel})`,
    sql`UPDATE paiements_traites SET user_id = NULL WHERE user_id = ${id}`,
    // Sceaux reçus par d'autres membres : son nom est remplacé par « la cheffe »
    sql`UPDATE recompenses SET detail = 'de la cheffe' WHERE genre = 'sceau' AND user_id <> ${id} AND detail = ANY(${nomsSceau})`,
    // Données personnelles sans lien automatique avec le compte
    sql`DELETE FROM user_tomes WHERE user_id = ${texte}`,
    sql`DELETE FROM user_tomes_masques WHERE user_id = ${texte}`,
    sql`DELETE FROM tomes_perso WHERE user_id = ${texte}`,
    sql`DELETE FROM tome_covers WHERE user_id = ${texte}`,
    sql`DELETE FROM user_markers WHERE user_id = ${texte}`,
    sql`DELETE FROM user_sets WHERE user_id = ${texte}`,
    sql`DELETE FROM missives_lues WHERE user_id = ${id}`,
    // Contenu partagé : on garde l'historique des autres membres, sans le lien vers la personne
    sql`UPDATE defis SET choisi_par = NULL WHERE choisi_par = ${id}`,
    sql`UPDATE defis SET gagnant = NULL WHERE gagnant = ${id}`,
    sql`UPDATE missives SET auteur = NULL WHERE auteur = ${id}`,
    sql`UPDATE nouveautes SET auteur = NULL WHERE auteur = ${id}`,
    sql`UPDATE avertissements SET par = NULL WHERE par = ${id}`,
    sql`UPDATE bingo_cases SET valide_par = NULL WHERE valide_par = ${id}`,
    sql`UPDATE combats SET gagnant = NULL WHERE gagnant = ${id}`,
    sql`UPDATE tournois SET gagnant = NULL WHERE gagnant = ${id}`,
    sql`UPDATE tournoi_matchs SET gagnant = NULL WHERE gagnant = ${id}`,
    // Le compte : coloriages, commentaires, J'aime, XP, sessions… s'effacent avec lui
    sql`DELETE FROM users WHERE id = ${id}`,
  ]);
  await destroySession().catch(() => {});
  // Le navigateur vide aussi son cache (photos et coloriages gardés en mémoire), là où il le permet
  return NextResponse.json({ ok: true }, { headers: { 'Clear-Site-Data': '"cache"' } });
}
