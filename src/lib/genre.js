export const estMasculin = (genre) => genre === 'masculin';
export const accord = (genre, feminin, masculin) => (estMasculin(genre) ? masculin : feminin);
