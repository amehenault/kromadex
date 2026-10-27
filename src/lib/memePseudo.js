export const memeQuePseudo = (nom, pseudo) =>
  Boolean(nom && pseudo) && String(nom).trim().replace(/^@/, '').toLowerCase() === String(pseudo).trim().replace(/^@/, '').toLowerCase();
