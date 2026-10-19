// Hiérarchie de Kromadex (noms affichés des postes ; les valeurs en base ne changent pas)
//  coloriste : membre de base
//  cheffe    : Cheffe / Chef des coloristes, gagnant.e d'une épreuve mensuelle
//  modo      : Sentinelle du Kromadex, modérateur ou modératrice
//  menestrel : Ménestrelle ou Ménestrel, anime la communauté (1 épreuve et 1 bingo par mois)
//  admin     : Invocatrice des couleurs (unique)
// Chaque nom s'accorde au genre choisi dans le profil : le masculin seulement pour « masculin », sinon le féminin prime.
const FORMES = {
  coloriste: { f: 'Coloriste', m: 'Coloriste' },
  cheffe: { f: 'Cheffe des coloristes', m: 'Chef des coloristes' },
  modo: { f: 'Sentinelle du Kromadex', m: 'Sentinelle du Kromadex' },
  menestrel: { f: 'Ménestrelle', m: 'Ménestrel' },
  admin: { f: 'Invocatrice des couleurs', m: 'Invocateur des couleurs' },
};
const forme = (genre) => (genre === 'masculin' ? 'm' : 'f');

// Nom du poste d'une personne, accordé à son genre (sans genre connu : au féminin)
export const nomPoste = (role, genre) => (FORMES[role] || FORMES.coloriste)[forme(genre)];

// Noms génériques, quand on parle du poste en général (listes, filtres, explications) : au féminin
export const NOMS_POSTES = Object.fromEntries(Object.entries(FORMES).map(([cle, f]) => [cle, f.f]));
export const PLURIELS_POSTES = {
  coloriste: 'Coloristes',
  cheffe: 'Cheffes',
  modo: 'Sentinelles',
  menestrel: 'Ménestrelles',
  admin: 'Invocatrice',
};

// « Pionnière » ou « Pionnier » : s'ajoute au poste des bêta-testrices et bêta-testeurs
export const nomPionnier = (genre) => ({ f: 'Pionnière', m: 'Pionnier' })[forme(genre)];

// Couleur de chaque poste (variables définies dans root.css)
export const COULEURS_POSTES = {
  coloriste: 'var(--coloriste)',
  cheffe: 'var(--chef)',
  modo: 'var(--sentinelle)',
  menestrel: 'var(--chef)', // même couleur que les Cheffes
  admin: 'var(--admin)',
};
export const couleurPoste = (role) => COULEURS_POSTES[role] || COULEURS_POSTES.coloriste;
