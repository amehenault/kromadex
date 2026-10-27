import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { premierDuMoisQuebec, jourQuebec } from '@/lib/temps';


export const PRIX_PLUS = { mensuel: '3,79 $', annuel: '40,99 $' };

export const PAIEMENT_PLUS = 'https://amelacoloree.thrivecart.com/kromadex-abonnement/';
export const GESTION_PLUS = 'https://amelacoloree.thrivecart.com/updateinfo/';

export const lienPaiement = (userId, email) =>
  `${PAIEMENT_PLUS}?passthrough[user_id]=${encodeURIComponent(userId)}&passthrough[customer_email]=${encodeURIComponent(email || '')}`;

export const LIMITES = {
  combats: { gratuit: 3, plus: null, periode: 'mois', un: 'combat', plusieurs: 'combats' },
  duels: { gratuit: 0, plus: null, periode: 'mois', un: 'duel', plusieurs: 'duels' },
  epreuvesGroupe: { gratuit: 1, plus: 5, periode: 'mois', un: 'épreuve de groupe créée', plusieurs: 'épreuves de groupe créées', f: true },
  bingos: { gratuit: 1, plus: null, periode: 'mois', un: 'bingo', plusieurs: 'bingos' },
  tournois: { gratuit: 0, plus: null, periode: 'mois', un: 'tournoi du royaume', plusieurs: 'tournois du royaume' },
  expeditions: { gratuit: 3, plus: null, periode: 'annee', un: 'expédition', plusieurs: 'expéditions', f: true },
  epopees: { gratuit: 1, plus: null, periode: 'annee', un: 'épopée', plusieurs: 'épopées', f: true },
  propheties: { gratuit: 0, plus: null, periode: 'annee', un: 'prophétie', plusieurs: 'prophéties', f: true },
};

export const JOURS_STATS_GRATUIT = 30;

export const AVANTAGES = {
  gratuit: [
    'Publier tes coloriages, commenter, aimer et suivre',
    'Tes tomes, livres et crayons',
    'Quêtes et 62 niveaux',
    'Épreuve mensuelle officielle et toutes les épreuves de groupe',
    '1 épreuve de groupe créée par mois',
    '1 bingo par mois',
    '3 expéditions et 1 épopée par année',
    '3 joutes par mois',
    'Statistiques des 30 derniers jours',
  ],
  plus: [
    'Les 2 bingos du mois',
    'Toutes les expéditions, épopées et prophéties',
    'Un Parchemin du Destin chaque mois dans ton inventaire',
    'Jusqu’à 5 épreuves de groupe créées par mois',
    'Les duels et des combats illimités',
    'Les tournois du royaume',
    'Toutes tes statistiques et ton historique complet',
    'Des cadres, thèmes et décorations exclusifs pour ton profil (bientôt)',
  ],
};

const actif = (date) => Boolean(date && new Date(date) > new Date());

export const offertActif = (u) => Boolean(u?.plus_offert && (!u.plus_offert_jusqu || new Date(u.plus_offert_jusqu) > new Date()));

export function estPlus(u) {
  if (!u) return false;
  if (u.role === 'admin' || offertActif(u)) return true;
  return actif(u.plus_jusqu) && u.plus_statut !== 'aucun';
}

export async function abonnementDe(userId) {
  const [u] = await sql`SELECT id, email, role, plus_statut, plus_jusqu, plus_formule, plus_offert, plus_offert_jusqu FROM users WHERE id = ${userId}`;
  return u ? { ...u, plus: estPlus(u) } : null;
}

export async function parcheminDuMois(userId) {
  const abo = await abonnementDe(userId);
  if (!abo?.plus) return;
  await sql`
    INSERT INTO recompenses (user_id, genre, detail, source, image, xp, victoire)
    VALUES (${userId}, 'parchemin', '', ${`plus:${premierDuMoisQuebec().slice(0, 7)}`}, '', 0, false)
    ON CONFLICT (user_id, genre, source) DO NOTHING`;
}

const debutPeriode = (periode) => (periode === 'annee' ? `${jourQuebec().slice(0, 4)}-01-01` : premierDuMoisQuebec());

async function utilisation(userId, cle, contexte = {}) {
  const debut = debutPeriode(LIMITES[cle].periode);
  if (cle === 'combats' || cle === 'duels') {
    const genres = cle === 'duels' ? ['duel'] : ['duel', 'joute'];
    const [{ n }] = await sql`
      SELECT count(DISTINCT c.id)::int AS n FROM combats c JOIN combat_participants p ON p.combat_id = c.id
      WHERE p.user_id = ${userId} AND c.genre = ANY(${genres})
        AND (c.cree_le AT TIME ZONE 'America/Toronto')::date >= ${debut}::date
        AND c.id <> ${contexte.combatId ?? -1}`;
    return n;
  }
  if (cle === 'epreuvesGroupe') {
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM defis WHERE genre = 'groupe' AND choisi_par = ${userId} AND mois = ${debut}::date`;
    return n;
  }
  if (cle === 'bingos') {
    const [{ n }] = await sql`
      SELECT count(*)::int AS n FROM bingo_inscriptions c JOIN bingos b ON b.id = c.bingo_id
      WHERE c.user_id = ${userId} AND b.id <> ${contexte.bingoId ?? -1}
        AND COALESCE(b.fin, (date_trunc('month', b.debut) + interval '1 month - 2 days')::date) >= ${debut}::date`;
    return n;
  }
  if (cle === 'expeditions' || cle === 'propheties' || cle === 'epopees') {
    const genre = { expeditions: 'expedition', propheties: 'prophetie', epopees: 'epopee' }[cle];
    const [{ n }] = await sql`
      SELECT count(*)::int AS n FROM aventures a
      WHERE a.genre = ${genre} AND a.debut >= ${debut}::date AND a.id <> ${contexte.aventureId ?? -1}
        AND (EXISTS (SELECT 1 FROM aventure_soumissions s WHERE s.aventure_id = a.id AND s.user_id = ${userId})
          OR EXISTS (SELECT 1 FROM aventure_inscriptions i WHERE i.aventure_id = a.id AND i.user_id = ${userId}))`;
    return n;
  }
  return 0;
}

export async function verifierLimite(userId, cle, contexte) {
  const limite = LIMITES[cle];
  const abo = await abonnementDe(userId);
  const max = abo?.plus ? limite.plus : limite.gratuit;
  if (max === null) return null;
  if (max > 0 && (await utilisation(userId, cle, contexte)) < max) return null;
  const nom = max > 1 ? limite.plusieurs : limite.un;
  const par = limite.periode === 'annee' ? 'par année' : 'par mois';
  const message = max === 0
    ? `Les ${limite.plusieurs} sont réservé${limite.f ? 'es' : 's'} à Kromadex+. Découvre l’abonnement en cliquant ici.`
    : abo?.plus
      ? `Tu as atteint la limite de ${max} ${nom} ${par}.`
      : `La version gratuite permet ${max} ${nom} ${par}. Avec Kromadex+, profites-en davantage. Découvre l’abonnement en cliquant ici.`;
  return NextResponse.json({ error: message, plus: !abo?.plus }, { status: 402 });
}
