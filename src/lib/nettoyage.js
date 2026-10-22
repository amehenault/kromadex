import { sql } from '@/lib/db';
import { JOURS_ARCHIVES } from '@/lib/demandes';

// Nettoyage automatique des données (politique de confidentialité), lancé une fois par jour par la tâche planifiée
// de vercel.json (/api/rappels, chaque matin) et à la demande par /api/nettoyage.
//
// Sécurité : tant que la variable NETTOYAGE_AUTO ne vaut pas « actif », rien n'est supprimé (simulation) :
// on compte seulement ce qui le serait. L'Invocatrice l'active quand elle a validé les durées.
//
// Durées :
//  - demandes d'aide fermées (résolues, ajoutées, refusées) : 30 jours après leur fermeture (rouverte = plus de suppression) ;
//  - journal des avis ThriveCart (paiements_evenements, contenu résumé) : 30 jours après réception.
//    paiements_traites (clé de l'avis, événement, date) est gardé : il empêche d'appliquer deux fois le même paiement ;
//  - tentatives de connexion / d'inscription / de mot de passe oublié (empreintes seulement) : 2 jours ;
//  - liens de réinitialisation du mot de passe (valables 1 heure) : 1 jour après leur expiration ;
//  - sessions expirées (30 jours) : dès leur expiration ;
//  - appareils connus : 1 an et 1 jour après leur création (le cookie dure 1 an et n'est jamais prolongé).
export const REGLES_NETTOYAGE = [
  { cle: 'demandes', compter: () => sql`SELECT count(*)::int AS n FROM demandes WHERE ferme_le < now() - make_interval(days => ${JOURS_ARCHIVES})`,
    supprimer: () => sql`DELETE FROM demandes WHERE ferme_le < now() - make_interval(days => ${JOURS_ARCHIVES}) RETURNING 1` },
  { cle: 'avis_thrivecart', compter: () => sql`SELECT count(*)::int AS n FROM paiements_evenements WHERE recu_le < now() - interval '30 days'`,
    supprimer: () => sql`DELETE FROM paiements_evenements WHERE recu_le < now() - interval '30 days' RETURNING 1` },
  { cle: 'tentatives', compter: () => sql`SELECT count(*)::int AS n FROM essais_limites WHERE cree_le < now() - interval '2 days'`,
    supprimer: () => sql`DELETE FROM essais_limites WHERE cree_le < now() - interval '2 days' RETURNING 1` },
  { cle: 'reinitialisations', compter: () => sql`SELECT count(*)::int AS n FROM reinitialisations WHERE expire_le < now() - interval '1 day'`,
    supprimer: () => sql`DELETE FROM reinitialisations WHERE expire_le < now() - interval '1 day' RETURNING 1` },
  { cle: 'sessions', compter: () => sql`SELECT count(*)::int AS n FROM sessions WHERE expires_at < now()`,
    supprimer: () => sql`DELETE FROM sessions WHERE expires_at < now() RETURNING 1` },
  { cle: 'appareils_connus', compter: () => sql`SELECT count(*)::int AS n FROM appareils_connus WHERE cree_le < now() - interval '366 days'`,
    supprimer: () => sql`DELETE FROM appareils_connus WHERE cree_le < now() - interval '366 days' RETURNING 1` },
];

export const nettoyageActif = () => process.env.NETTOYAGE_AUTO === 'actif';

// Renvoie { actif, resultats: { cle: nombre } } : nombre supprimé (actif) ou qui le serait (simulation).
// Une règle en erreur n'empêche pas les autres.
export async function nettoyer({ actif = nettoyageActif() } = {}) {
  const resultats = {};
  for (const r of REGLES_NETTOYAGE) {
    try {
      resultats[r.cle] = actif ? (await r.supprimer()).length : (await r.compter())[0].n;
    } catch (e) {
      console.error(`Nettoyage ${r.cle} :`, e.message);
      resultats[r.cle] = 'erreur';
    }
  }
  return { actif, resultats };
}
