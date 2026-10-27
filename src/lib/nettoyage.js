import { sql } from '@/lib/db';
import { JOURS_ARCHIVES } from '@/lib/demandes';

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
