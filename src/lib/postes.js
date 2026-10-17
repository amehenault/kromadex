// Hiérarchie de Kromadex (noms affichés des postes ; les valeurs en base ne changent pas)
//  coloriste : membre de base
//  cheffe    : Chef·fe des coloristes, gagnant·e d'une épreuve mensuelle
//  modo      : Sentinelle du Kromadex, modérateur ou modératrice
//  admin     : Invocatrice originelle (unique)
export const NOMS_POSTES = {
  coloriste: 'Coloriste',
  cheffe: 'Chef·fe des coloristes',
  modo: 'Sentinelle du Kromadex',
  admin: 'Invocatrice originelle',
};
export const PLURIELS_POSTES = {
  coloriste: 'Coloristes',
  cheffe: 'Chef·fes',
  modo: 'Sentinelles',
  admin: 'Invocatrice',
};
export const nomPoste = (role) => NOMS_POSTES[role] || NOMS_POSTES.coloriste;
