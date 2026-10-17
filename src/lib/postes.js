// Hiérarchie de Kromadex (noms affichés des postes ; les valeurs en base ne changent pas)
//  coloriste : membre de base
//  cheffe    : Cheffe / Chef des coloristes, gagnant.e d'une épreuve mensuelle
//  modo      : Sentinelle du Kromadex, modérateur ou modératrice
//  admin     : Invocatrice des couleurs (unique)
// Chaque nom s'accorde au genre choisi dans le profil : féminin, masculin, sinon la forme inclusive (Chef.fe).
const FORMES = {
  coloriste: { f: 'Coloriste', m: 'Coloriste', i: 'Coloriste' },
  cheffe: { f: 'Cheffe des coloristes', m: 'Chef des coloristes', i: 'Chef.fe des coloristes' },
  modo: { f: 'Sentinelle du Kromadex', m: 'Sentinelle du Kromadex', i: 'Sentinelle du Kromadex' },
  admin: { f: 'Invocatrice des couleurs', m: 'Invocateur des couleurs', i: 'Invocatrice des couleurs' },
};
const forme = (genre) => (genre === 'feminin' ? 'f' : genre === 'masculin' ? 'm' : 'i');

// Nom du poste d'une personne, accordé à son genre (sans genre connu : forme inclusive)
export const nomPoste = (role, genre) => (FORMES[role] || FORMES.coloriste)[forme(genre)];

// Noms génériques, quand on parle du poste en général (listes, filtres, explications)
export const NOMS_POSTES = Object.fromEntries(Object.entries(FORMES).map(([cle, f]) => [cle, f.i]));
export const PLURIELS_POSTES = {
  coloriste: 'Coloristes',
  cheffe: 'Chef.fes',
  modo: 'Sentinelles',
  admin: 'Invocatrice',
};

// « Pionnière », « Pionnier » ou « Pionnier.ère » : s'ajoute au poste des bêta-testrices et bêta-testeurs
export const nomPionnier = (genre) => ({ f: 'Pionnière', m: 'Pionnier', i: 'Pionnier.ère' })[forme(genre)];

// Couleur de chaque poste (variables définies dans root.css)
export const COULEURS_POSTES = {
  coloriste: 'var(--coloriste)',
  cheffe: 'var(--chef)',
  modo: 'var(--sentinelle)',
  admin: 'var(--admin)',
};
export const couleurPoste = (role) => COULEURS_POSTES[role] || COULEURS_POSTES.coloriste;
