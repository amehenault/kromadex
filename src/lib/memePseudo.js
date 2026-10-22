// Le nom est-il le même que le pseudo (sans tenir compte du @, des majuscules ni des espaces) ?
// Sert à ne pas afficher deux fois la même chose sur un profil.
export const memeQuePseudo = (nom, pseudo) =>
  Boolean(nom && pseudo) && String(nom).trim().replace(/^@/, '').toLowerCase() === String(pseudo).trim().replace(/^@/, '').toLowerCase();
