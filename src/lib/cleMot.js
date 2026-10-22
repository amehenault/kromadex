// Clé de comparaison d'un mot-clef (utilisable dans le navigateur et sur le serveur) : deux mots-clefs qui ont
// la même clé sont considérés comme le même mot (« Lapin », « lapin », « Lapins », « lapîns » → « lapin »).
//  - minuscules, sans accents, ponctuation et espaces en trop retirés ;
//  - chaque mot au singulier : -eaux → -eau, -aux → -al (chevaux → cheval), sinon le s ou le x final retiré
//    (seulement pour les mots de plus de 3 lettres : « bus », « pas » ne bougent pas).
export function cleMot(mot) {
  return String(mot || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((m) => {
      if (m.length <= 3) return m;
      if (m.endsWith('eaux')) return m.slice(0, -1);
      if (m.endsWith('aux')) return `${m.slice(0, -3)}al`;
      return m.replace(/[sx]$/, '');
    })
    .join(' ');
}
