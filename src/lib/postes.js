const FORMES = {
  coloriste: { f: 'Coloriste', m: 'Coloriste' },
  cheffe: { f: 'Cheffe des coloristes', m: 'Chef des coloristes' },
  modo: { f: 'Sentinelle du Kromadex', m: 'Sentinelle du Kromadex' },
  menestrel: { f: 'Ménestrelle', m: 'Ménestrel' },
  admin: { f: 'Invocatrice des couleurs', m: 'Invocateur des couleurs' },
};
const forme = (genre) => (genre === 'masculin' ? 'm' : 'f');

export const nomPoste = (role, genre) => (FORMES[role] || FORMES.coloriste)[forme(genre)];

export const NOMS_POSTES = Object.fromEntries(Object.entries(FORMES).map(([cle, f]) => [cle, f.f]));
export const PLURIELS_POSTES = {
  coloriste: 'Coloristes',
  cheffe: 'Cheffes',
  modo: 'Sentinelles',
  menestrel: 'Ménestrelles',
  admin: 'Invocatrice',
};

export const nomPionnier = (genre) => ({ f: 'Pionnière', m: 'Pionnier' })[forme(genre)];

export const COULEURS_POSTES = {
  coloriste: 'var(--coloriste)',
  cheffe: 'var(--chef)',
  modo: 'var(--sentinelle)',
  menestrel: 'var(--chef)',
  admin: 'var(--admin)',
};
export const couleurPoste = (role) => COULEURS_POSTES[role] || COULEURS_POSTES.coloriste;
