// Hiérarchie de Kromadex (noms affichés des postes ; les valeurs en base ne changent pas)
//  coloriste : membre de base
//  cheffe    : Chef·fe des coloristes, gagnant·e d'une épreuve mensuelle
//  modo      : Sentinelle du Kromadex, modérateur ou modératrice
//  admin     : Invocatrice des couleurs (unique)
export const NOMS_POSTES = {
  coloriste: 'Coloriste',
  cheffe: 'Chef·fe des coloristes',
  modo: 'Sentinelle du Kromadex',
  admin: 'Invocatrice des couleurs',
};
export const PLURIELS_POSTES = {
  coloriste: 'Coloristes',
  cheffe: 'Chef·fes',
  modo: 'Sentinelles',
  admin: 'Invocatrice',
};
export const nomPoste = (role) => NOMS_POSTES[role] || NOMS_POSTES.coloriste;

// Couleur de chaque poste (variables définies dans root.css)
export const COULEURS_POSTES = {
  coloriste: 'var(--coloriste)',
  cheffe: 'var(--chef)',
  modo: 'var(--sentinelle)',
  admin: 'var(--admin)',
};
export const couleurPoste = (role) => COULEURS_POSTES[role] || COULEURS_POSTES.coloriste;
