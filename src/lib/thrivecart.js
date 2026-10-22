import { createHash, timingSafeEqual } from 'node:crypto';

// Outils du webhook ThriveCart (sans accès à la base, pour pouvoir les tester seuls)

export function memeSecret(recu, attendu) {
  const a = Buffer.from(String(recu || '')), b = Buffer.from(String(attendu || ''));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

// Lit un champ, qu'il arrive en JSON imbriqué (customer.email) ou en formulaire (customer[email])
export const champ = (d, ...cles) => {
  for (const c of cles) {
    const v = c.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d) ?? d[c.replace(/\.(\w+)/g, '[$1]')];
    if (v !== undefined && v !== '') return String(v);
  }
  return '';
};

// Mode attendu par cet environnement : « live » en production (par défaut), « test » pour un environnement de test.
// Un avis d'un autre mode est ignoré : un achat de test ne donne jamais Kromadex+ sur le site en ligne.
export const modeAttendu = () => (process.env.THRIVECART_MODE === 'test' ? 'test' : 'live');
export function modeAccepte(d, attendu = modeAttendu()) {
  return champ(d, 'mode') === attendu;
}

// Clé unique d'un avis : ThriveCart donne un event_id propre à chaque événement (le même si l'avis est renvoyé).
// Sans event_id, empreinte de tout le contenu de l'avis (une copie identique donne la même clé).
export function cleEvenement(d) {
  const evenement = champ(d, 'event');
  const id = champ(d, 'event_id');
  if (id) return `${evenement}:${id}`;
  const { thrivecart_secret: _secret, ...reste } = d;
  return `${evenement}:sans-id:${createHash('sha256').update(stable(reste)).digest('hex')}`;
}

// JSON avec les clés triées à tous les niveaux (même contenu = même texte, quel que soit l'ordre des champs)
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}

// Ce qui est gardé d'un avis dans le journal (paiements_evenements) : une liste explicite de champs, jamais l'avis complet.
// Seuls les champs que le code utilise sont confirmés ; le reste de l'avis (nom, adresse, carte…) n'est jamais conservé.
// Le courriel est gardé à part (colonne courriel) pour retrouver un paiement fait avec un autre courriel.
export function resumeAvis(d) {
  return {
    event: champ(d, 'event'),
    event_id: champ(d, 'event_id'),
    mode: champ(d, 'mode'),
    passthrough_user_id: champ(d, 'passthrough.user_id', 'passthrough[user_id]'),
    order_total: champ(d, 'order.total', 'order_total'),
    order_total_str: champ(d, 'order.total_str', 'order.total_gross_str'),
    formule: formuleDe(d),
  };
}

// Mensuel ou annuel : d'après le nom ou la fréquence du paiement, sinon d'après le montant (40,99 contre 3,79)
export function formuleDe(d) {
  const texte = JSON.stringify(d).toLowerCase();
  if (/annuel|annual|yearly|"year"|per year|\/yr/.test(texte)) return 'annuel';
  if (/mensuel|monthly|"month"|per month|\/mo/.test(texte)) return 'mensuel';
  // ThriveCart donne order.total en cents et order.total_str en dollars (ex. 379 et « 3.79 »)
  const enDollars = parseFloat(champ(d, 'order.total_str', 'order.total_gross_str'));
  const dollars = Number.isFinite(enDollars) ? enDollars : (parseFloat(champ(d, 'order.total', 'order_total')) || 0) / 100;
  return dollars >= 20 ? 'annuel' : 'mensuel';
}
