export const MIN_REPONSES = 2;
export const MAX_REPONSES = 8;
export const DUREES_SONDAGE = [
  { heures: 24, label: '24 heures' },
  { heures: 48, label: '48 heures' },
  { heures: 72, label: '72 heures' },
  { heures: 120, label: '5 jours' },
  { heures: 168, label: '7 jours' },
];
export const DUREE_PAR_DEFAUT = 48;

export function lireSondage(s) {
  if (!s || typeof s !== 'object') return null;
  const options = (Array.isArray(s.options) ? s.options : []).map((o) => String(o || '').trim().slice(0, 100)).filter(Boolean);
  if (options.length < MIN_REPONSES || options.length > MAX_REPONSES) {
    return { erreur: `Le sondage doit avoir entre ${MIN_REPONSES} et ${MAX_REPONSES} réponses` };
  }
  const heures = DUREES_SONDAGE.some((d) => d.heures === Number(s.heures)) ? Number(s.heures) : DUREE_PAR_DEFAUT;
  return { options, multiple: s.multiple === true, heures };
}
