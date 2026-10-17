import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { sql } from '@/lib/db';
import { prevenir } from '@/lib/push';

export const dynamic = 'force-dynamic';

// Avis de paiement ThriveCart (webhook) pour Kromadex+.
// Dans ThriveCart : Settings > API & webhooks > Webhooks & notifications, adresse https://<site>/api/paiements/thrivecart
// Le mot secret ThriveCart (même écran) doit être dans la variable THRIVECART_SECRET.

// ThriveCart vérifie l'adresse avec une requête HEAD (ou GET) avant de l'enregistrer
export function HEAD() { return new Response(null, { status: 200 }); }
export function GET() { return NextResponse.json({ ok: true }); }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function memeSecret(recu, attendu) {
  const a = Buffer.from(String(recu || '')), b = Buffer.from(String(attendu || ''));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

// Les avis arrivent en formulaire (clés comme customer[email]) ou en JSON
async function lireDonnees(req) {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/json')) return req.json().catch(() => ({}));
  const texte = await req.text();
  return Object.fromEntries(new URLSearchParams(texte));
}

const champ = (d, ...cles) => {
  for (const c of cles) {
    const v = c.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d) ?? d[c.replace(/\.(\w+)/g, '[$1]')];
    if (v !== undefined && v !== '') return String(v);
  }
  return '';
};

// Mensuel ou annuel : d'après le nom ou la fréquence du paiement, sinon d'après le montant (40,99 contre 3,79)
function formuleDe(d) {
  const texte = JSON.stringify(d).toLowerCase();
  if (/annuel|annual|yearly|"year"|per year|\/yr/.test(texte)) return 'annuel';
  if (/mensuel|monthly|"month"|per month|\/mo/.test(texte)) return 'mensuel';
  const montant = parseFloat(champ(d, 'order.total', 'order_total', 'order.charges.0.amount', 'amount')) || 0;
  // Montants parfois en cents
  const dollars = montant > 1000 ? montant / 100 : montant;
  return dollars >= 20 ? 'annuel' : 'mensuel';
}

export async function POST(req) {
  const d = await lireDonnees(req);
  const evenement = champ(d, 'event');
  const mode = champ(d, 'mode', 'mode_int');
  const courriel = champ(d, 'customer.email', 'customer[email]', 'email').toLowerCase().trim();
  const idPassthrough = champ(d, 'passthrough.user_id', 'passthrough[user_id]');

  // Le secret n'est jamais conservé dans le journal
  const { thrivecart_secret: secretRecu, ...aConserver } = d;
  const noter = (resultat, userId = null) => sql`
    INSERT INTO paiements_evenements (evenement, mode, user_id, courriel, resultat, donnees)
    VALUES (${evenement}, ${mode}, ${userId}, ${courriel}, ${resultat}, ${JSON.stringify(aConserver)})`;

  if (!process.env.THRIVECART_SECRET) {
    await noter('refusé : THRIVECART_SECRET manquant');
    return NextResponse.json({ error: 'Non configuré' }, { status: 503 });
  }
  if (!memeSecret(secretRecu, process.env.THRIVECART_SECRET)) {
    await noter('refusé : mot secret invalide');
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // La personne : l'identifiant transmis par le lien de paiement, sinon le courriel utilisé pour payer
  const [u] = UUID.test(idPassthrough)
    ? await sql`SELECT id FROM users WHERE id = ${idPassthrough}`
    : courriel ? await sql`SELECT id FROM users WHERE lower(email) = ${courriel}` : [];
  if (!u) {
    await noter('membre introuvable');
    // 200 pour que ThriveCart ne renvoie pas l'avis en boucle ; l'Invocatrice peut offrir Kromadex+ à la main
    return NextResponse.json({ ok: true, membre: false });
  }

  if (evenement === 'order.success' || evenement === 'order.subscription_payment') {
    // Paiement ou renouvellement : actif jusqu'à la fin de la période payée, plus 3 jours de marge pour le prochain prélèvement
    const formule = formuleDe(d);
    const duree = formule === 'annuel' ? '1 year 3 days' : '1 month 3 days';
    await sql`
      UPDATE users SET plus_statut = 'actif', plus_formule = ${formule},
        plus_jusqu = GREATEST(COALESCE(plus_jusqu, now()), now()) + ${duree}::interval
      WHERE id = ${u.id}`;
    await noter(`actif (${formule})`, u.id);
    if (evenement === 'order.success') prevenir('abonnement', { ids: [u.id] }, { titre: 'Bienvenue dans Kromadex+', texte: 'Ton abonnement est actif. Merci de soutenir Kromadex !', lien: '/kromadex-plus' });
  } else if (evenement === 'order.subscription_cancelled') {
    // Annulé : Kromadex+ reste actif jusqu'à la fin de la période déjà payée
    await sql`UPDATE users SET plus_statut = 'annule' WHERE id = ${u.id}`;
    await noter('annulé, actif jusqu’à la fin de la période payée', u.id);
  } else if (evenement === 'order.refund') {
    await sql`UPDATE users SET plus_statut = 'aucun', plus_jusqu = now() WHERE id = ${u.id}`;
    await noter('remboursé, Kromadex+ retiré', u.id);
  } else {
    // Ex. prélèvement refusé : rien à faire, l'accès s'arrête seul à la fin de la période payée
    await noter('ignoré', u.id);
  }
  return NextResponse.json({ ok: true });
}
