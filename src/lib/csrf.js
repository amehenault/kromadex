// Protection CSRF : une requête qui modifie des données (POST, PUT, PATCH, DELETE) doit venir de l'appli elle-même.
// Le cookie SameSite=Lax bloque déjà la plupart des cas, mais pas tous (sous-domaines « same-site », anciens
// navigateurs, futurs changements). On vérifie donc aussi l'origine de la requête :
//  - en-tête Origin présent : il doit désigner exactement ce site ;
//  - sinon, en-tête Sec-Fetch-Site présent : seulement « same-origin » ou « none » (adresse tapée) ;
//  - aucun des deux : client hors navigateur (pas de cookie envoyé à son insu), accepté.
export const METHODES_SURES = ['GET', 'HEAD', 'OPTIONS'];

// Adresses appelées par des services extérieurs, protégées autrement (mot secret)
export const EXCEPTIONS_CSRF = ['/api/paiements/thrivecart'];

export function requeteAutorisee({ methode, chemin = '', origin, secFetchSite, hote }) {
  if (METHODES_SURES.includes(String(methode).toUpperCase())) return true;
  if (EXCEPTIONS_CSRF.some((e) => chemin === e || chemin.startsWith(`${e}/`))) return true;
  if (origin) {
    try { return new URL(origin).host === hote; } catch { return false; } // « null » ou adresse invalide : refusé
  }
  if (secFetchSite) return secFetchSite === 'same-origin' || secFetchSite === 'none';
  return true;
}
