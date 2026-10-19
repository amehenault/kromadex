// Accord selon le genre choisi au profil : le masculin seulement quand la personne a choisi « masculin ».
// Féminin, non-binaire, autre ou genre inconnu : le féminin prime (Pionnière, Cheffe, inscrite, sûre…).
export const estMasculin = (genre) => genre === 'masculin';
export const accord = (genre, feminin, masculin) => (estMasculin(genre) ? masculin : feminin);
