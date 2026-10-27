import { createHash, timingSafeEqual } from 'node:crypto';


export function memeSecret(recu, attendu) {
  const a = Buffer.from(String(recu || '')), b = Buffer.from(String(attendu || ''));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export const champ = (d, ...cles) => {
  for (const c of cles) {
    const v = c.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d) ?? d[c.replace(/\.(\w+)/g, '[$1]')];
    if (v !== undefined && v !== '') return String(v);
  }
  return '';
};

export const modeAttendu = () => (process.env.THRIVECART_MODE === 'test' ? 'test' : 'live');
export function modeAccepte(d, attendu = modeAttendu()) {
  return champ(d, 'mode') === attendu;
}

export function cleEvenement(d) {
  const evenement = champ(d, 'event');
  const id = champ(d, 'event_id');
  if (id) return `${evenement}:${id}`;
  const { thrivecart_secret: _secret, ...reste } = d;
  return `${evenement}:sans-id:${createHash('sha256').update(stable(reste)).digest('hex')}`;
}

function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}

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

export function formuleDe(d) {
  const texte = JSON.stringify(d).toLowerCase();
  if (/annuel|annual|yearly|"year"|per year|\/yr/.test(texte)) return 'annuel';
  if (/mensuel|monthly|"month"|per month|\/mo/.test(texte)) return 'mensuel';
  const enDollars = parseFloat(champ(d, 'order.total_str', 'order.total_gross_str'));
  const dollars = Number.isFinite(enDollars) ? enDollars : (parseFloat(champ(d, 'order.total', 'order_total')) || 0) / 100;
  return dollars >= 20 ? 'annuel' : 'mensuel';
}
