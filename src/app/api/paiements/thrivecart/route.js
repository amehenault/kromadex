import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { prevenir } from '@/lib/push';
import { memeSecret, champ, modeAccepte, modeAttendu, cleEvenement, formuleDe, resumeAvis } from '@/lib/thrivecart';

export const dynamic = 'force-dynamic';

// Avis de paiement ThriveCart (webhook) pour Kromadex+.
// Dans ThriveCart : Settings > API & webhooks > Webhooks & notifications, adresse https://<site>/api/paiements/thrivecart
// Le mot secret ThriveCart (même écran) doit être dans la variable THRIVECART_SECRET.
// THRIVECART_MODE : « live » (par défaut, production) ou « test » (environnement de test seulement).
//
// Chaque avis n'est appliqué qu'une seule fois : sa clé (event_id) est enregistrée dans paiements_traites
// dans la MÊME requête SQL que le changement d'abonnement. Deux copies arrivées en même temps ne peuvent donc
// pas prolonger Kromadex+ deux fois : la deuxième trouve la clé déjà prise et ne change rien.

// ThriveCart vérifie l'adresse avec une requête HEAD (ou GET) avant de l'enregistrer
export function HEAD() { return new Response(null, { status: 200 }); }
export function GET() { return NextResponse.json({ ok: true }); }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Les avis arrivent en formulaire (clés comme customer[email]) ou en JSON
async function lireDonnees(req) {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/json')) return req.json().catch(() => ({}));
  const texte = await req.text();
  return Object.fromEntries(new URLSearchParams(texte));
}

export async function POST(req) {
  const d = await lireDonnees(req);
  const evenement = champ(d, 'event');
  const mode = champ(d, 'mode');
  const courriel = champ(d, 'customer.email', 'customer[email]', 'email').toLowerCase().trim();
  const idPassthrough = champ(d, 'passthrough.user_id', 'passthrough[user_id]');

  // Journal : seulement les champs listés dans resumeAvis (jamais le secret, le nom, l'adresse ou la carte).
  // Un avis refusé (pas authentifié) ne garde ni courriel ni contenu. Le journal est vidé 30 jours après réception (lib/nettoyage.js).
  const secretRecu = d.thrivecart_secret;
  const noter = (resultat, userId = null, { refuse = false, sansLien = false } = {}) => {
    const resume = refuse ? {} : resumeAvis(d);
    if (sansLien) delete resume.passthrough_user_id;
    return sql`
      INSERT INTO paiements_evenements (evenement, mode, user_id, courriel, resultat, donnees)
      VALUES (${evenement}, ${mode}, ${userId}, ${refuse ? '' : courriel}, ${resultat}, ${JSON.stringify(resume)})`;
  };

  if (!process.env.THRIVECART_SECRET) {
    await noter('refusé : THRIVECART_SECRET manquant', null, { refuse: true });
    return NextResponse.json({ error: 'Non configuré' }, { status: 503 });
  }
  if (!memeSecret(secretRecu, process.env.THRIVECART_SECRET)) {
    await noter('refusé : mot secret invalide', null, { refuse: true });
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  // Test et production séparés : un avis d'un autre mode n'a aucun effet (200 pour que ThriveCart ne le renvoie pas)
  if (!modeAccepte(d)) {
    await noter(`ignoré : mode « ${mode || 'inconnu'} » (ce site accepte « ${modeAttendu()} »)`);
    return NextResponse.json({ ok: true, ignore: 'mode' });
  }

  // La personne : l'identifiant transmis par le lien de paiement, sinon le courriel utilisé pour payer
  const [u] = UUID.test(idPassthrough)
    ? await sql`SELECT id FROM users WHERE id = ${idPassthrough}`
    : courriel ? await sql`SELECT id FROM users WHERE lower(email) = ${courriel}` : [];
  if (!u) {
    // Ex. compte supprimé : on ne garde pas l'identifiant de l'ancien compte (seulement le courriel, effacé après 30 jours)
    await noter('membre introuvable', null, { sansLien: true });
    // 200 pour que ThriveCart ne renvoie pas l'avis en boucle ; l'Invocatrice peut offrir Kromadex+ à la main
    return NextResponse.json({ ok: true, membre: false });
  }

  const cle = cleEvenement(d);
  // Applique le changement seulement si la clé de l'avis est nouvelle (une seule requête, donc atomique)
  const appliquer = async (miseAJour) => {
    const r = await sql`
      WITH nouveau AS (
        INSERT INTO paiements_traites (cle, evenement, mode, user_id) VALUES (${cle}, ${evenement}, ${mode}, ${u.id})
        ON CONFLICT (cle) DO NOTHING RETURNING cle
      )
      ${miseAJour}`;
    return r.length > 0;
  };

  if (evenement === 'order.success' || evenement === 'order.subscription_payment') {
    // Paiement ou renouvellement : actif jusqu'à la fin de la période payée, plus 3 jours de marge pour le prochain prélèvement
    const formule = formuleDe(d);
    const duree = formule === 'annuel' ? '1 year 3 days' : '1 month 3 days';
    const fait = await appliquer(sql`
      UPDATE users SET plus_statut = 'actif', plus_formule = ${formule},
        plus_jusqu = GREATEST(COALESCE(plus_jusqu, now()), now()) + ${duree}::interval
      WHERE id = ${u.id} AND EXISTS (SELECT 1 FROM nouveau) RETURNING id`);
    if (!fait) { await noter('doublon ignoré (déjà traité)', u.id); return NextResponse.json({ ok: true, doublon: true }); }
    await noter(`actif (${formule})`, u.id);
    if (evenement === 'order.success') prevenir('abonnement', { ids: [u.id] }, { titre: 'Bienvenue dans Kromadex+', texte: 'Ton abonnement est actif. Merci de soutenir Kromadex !', lien: '/kromadex-plus' });
  } else if (evenement === 'order.subscription_cancelled') {
    // Annulé : Kromadex+ reste actif jusqu'à la fin de la période déjà payée
    const fait = await appliquer(sql`UPDATE users SET plus_statut = 'annule' WHERE id = ${u.id} AND EXISTS (SELECT 1 FROM nouveau) RETURNING id`);
    await noter(fait ? 'annulé, actif jusqu’à la fin de la période payée' : 'doublon ignoré (déjà traité)', u.id);
  } else if (evenement === 'order.refund') {
    const fait = await appliquer(sql`UPDATE users SET plus_statut = 'aucun', plus_jusqu = now() WHERE id = ${u.id} AND EXISTS (SELECT 1 FROM nouveau) RETURNING id`);
    await noter(fait ? 'remboursé, Kromadex+ retiré' : 'doublon ignoré (déjà traité)', u.id);
  } else {
    // Ex. prélèvement refusé : rien à faire, l'accès s'arrête seul à la fin de la période payée
    await noter('ignoré', u.id);
  }
  return NextResponse.json({ ok: true });
}
