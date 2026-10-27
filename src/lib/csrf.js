export const METHODES_SURES = ['GET', 'HEAD', 'OPTIONS'];

export const EXCEPTIONS_CSRF = ['/api/paiements/thrivecart'];

export function requeteAutorisee({ methode, chemin = '', origin, secFetchSite, hote }) {
  if (METHODES_SURES.includes(String(methode).toUpperCase())) return true;
  if (EXCEPTIONS_CSRF.some((e) => chemin === e || chemin.startsWith(`${e}/`))) return true;
  if (origin) {
    try { return new URL(origin).host === hote; } catch { return false; }
  }
  if (secFetchSite) return secFetchSite === 'same-origin' || secFetchSite === 'none';
  return true;
}
