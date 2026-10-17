// Heure de référence de Kromadex : le Québec. Les épreuves, bingos et quêtes commencent
// et se terminent à minuit, heure du Québec. L'affichage, lui, suit le pays choisi au profil.
export const FUSEAU_REF = 'America/Toronto'; // même heure que Montréal et Québec

// Date du jour au Québec, au format AAAA-MM-JJ
export function jourQuebec(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU_REF, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function ajouterJours(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Premier jour du mois (AAAA-MM-01) au Québec, avec un décalage en mois
export function premierDuMoisQuebec(decalage = 0) {
  const d = new Date(`${jourQuebec().slice(0, 7)}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + decalage);
  return d.toISOString().slice(0, 10);
}

// Dernier jour du mois d'une date AAAA-MM-JJ
export function finDuMois(iso) {
  const d = new Date(`${iso.slice(0, 7)}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

// Temps restant avant un instant : en jours, puis en heures et minutes sous 24 h
export function texteTempsRestant(fin, maintenant = Date.now()) {
  const ms = new Date(fin).getTime() - maintenant;
  if (!(ms > 0)) return 'Terminé';
  const minutes = Math.floor(ms / 60000);
  const heures = Math.floor(minutes / 60);
  const jours = Math.floor(heures / 24);
  if (jours >= 1) return `Plus que ${jours} jour${jours > 1 ? 's' : ''}`;
  if (heures >= 1) return `Plus que ${heures} h ${String(minutes % 60).padStart(2, '0')} min`;
  return `Plus que ${Math.max(1, minutes)} min`;
}

// Date et heure dans le fuseau de la personne
export function formaterInstant(instant, fuseau, avecHeure = true) {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: fuseau || FUSEAU_REF, day: 'numeric', month: 'long',
    ...(avecHeure ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(instant));
}
