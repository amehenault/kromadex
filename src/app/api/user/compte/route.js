import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUser, verifyPassword, destroySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Supprimer son compte et toutes ses données (mot de passe exigé).
// La plupart des tables s'effacent avec le compte (ON DELETE CASCADE) ; les autres sont traitées ici :
// les données personnelles sont supprimées, et ce qui touche d'autres membres (épreuves créées, missives,
// gagnants passés) garde son contenu mais perd le lien vers la personne.
export async function DELETE(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { motDePasse } = await req.json().catch(() => ({}));

  const [u] = await sql`SELECT role, password_hash, plus_statut, plus_jusqu FROM users WHERE id = ${user.id}`;
  if (!u || !verifyPassword(String(motDePasse || ''), u.password_hash)) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 });
  }
  if (u.role === 'admin') {
    return NextResponse.json({ error: 'Le compte de l’Invocatrice ne peut pas être supprimé.' }, { status: 403 });
  }
  // Un abonnement payé doit d'abord être annulé chez ThriveCart, sinon les prélèvements continueraient
  if (u.plus_statut === 'actif' && u.plus_jusqu && new Date(u.plus_jusqu) > new Date()) {
    return NextResponse.json({ error: 'Annule d’abord ton abonnement Kromadex+ (Paramètres > Kromadex+ et mon abonnement), puis reviens supprimer ton compte.' }, { status: 409 });
  }

  const id = user.id;
  const texte = String(id);
  await sql.transaction([
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
    sql`UPDATE paiements_evenements SET user_id = NULL WHERE user_id = ${id}`,
    // Le compte : coloriages, commentaires, J'aime, XP, sessions… s'effacent avec lui
    sql`DELETE FROM users WHERE id = ${id}`,
  ]);
  await destroySession().catch(() => {});
  return NextResponse.json({ ok: true });
}
