import { nomPionnier } from '@/lib/postes';
import IMAGES from '@/lib/manifesteRecompenses.json';

// Catalogue des récompenses des activités (utilisable dans le navigateur et sur le serveur).
//
// Les images sont trouvées AUTOMATIQUEMENT : il suffit de déposer le fichier (svg, png, webp ou jpg)
// dans le bon dossier avec le bon mot dans son nom (voir « auto » ci-dessous, ex. epreuve/mensuelles/…coffre….svg).
// La liste des images (src/lib/manifesteRecompenses.json) est refaite à chaque compilation et à chaque npm run dev.
// Une récompense peut aussi avoir sa propre image (ex. le badge d'une épreuve, le blason d'une épopée) :
// c'est le nom de fichier saisi dans l'espace admin, cherché dans le dossier de la récompense.
// Tant qu'aucune image ne correspond, une icône la remplace.
export const DOSSIER_RECOMPENSES = '/recompenses-activites';

export const RECOMPENSES = {
  // Badge des Pionnières et Pionniers (bêta) : pas enregistré dans la base, il suit la case Pionnière du membre
  pionnier: { nom: 'Badge', pluriel: 'badges', auto: { dossier: 'pionniers', mots: ['badge'] }, prestige: 110, icone: 'Award' },
  relique: { nom: 'Relique', pluriel: 'reliques', auto: { dossier: 'recompenses-activites/epreuve/sentinelles', mots: ['relique'], exclure: ['fragment'] }, prestige: 100, icone: 'Crown' },
  coffre: { nom: 'Coffre au trésor', pluriel: 'coffres au trésor', auto: { dossier: 'recompenses-activites/epreuve/mensuelles', mots: ['coffre'] }, prestige: 95, icone: 'Gem' },
  insigne: { nom: 'Insigne du tournoi', pluriel: 'insignes du tournoi', auto: { dossier: 'recompenses-activites/combat', mots: ['tournoi', 'insigne'] }, prestige: 90, icone: 'Medal' },
  blason: { nom: 'Blason', pluriel: 'blasons', auto: { dossier: 'recompenses-activites', mots: ['blason', 'epopee'] }, prestige: 85, icone: 'Shield' },
  orbe: { nom: 'Orbe magique', pluriel: 'orbes magiques', auto: { dossier: 'recompenses-activites', mots: ['orbe', 'prophetie'] }, prestige: 80, icone: 'Sparkles' },
  badge_epreuve: { nom: 'Badge du mois', pluriel: 'badges du mois', auto: { dossier: 'recompenses-activites/epreuve/mensuelles', mots: ['badge'] }, prestige: 75, icone: 'Award' },
  epee: { nom: 'Épée chromatique', pluriel: 'épées chromatiques', auto: { dossier: 'recompenses-activites/combat', mots: ['duel', 'epee'] }, prestige: 70, icone: 'Sword' },
  sceau: { nom: 'Sceau', pluriel: 'sceaux', auto: { dossier: 'recompenses-activites/epreuve/chef', mots: ['sceau'] }, prestige: 65, icone: 'Stamp' },
  badge_sentinelle: { nom: 'Badge de sentinelle', pluriel: 'badges de sentinelle', auto: { dossier: 'recompenses-activites/epreuve/sentinelles', mots: ['badge'] }, prestige: 60, icone: 'BadgeCheck' },
  boussole: { nom: 'Boussole', pluriel: 'boussoles', auto: { dossier: 'recompenses-activites/expedition', mots: ['boussole', 'expedition', 'level'] }, prestige: 55, icone: 'Compass' },
  joute: { nom: 'Joute', pluriel: 'joutes', auto: { dossier: 'recompenses-activites/combat', mots: ['joute'] }, prestige: 45, icone: 'Swords' },
  fragment: { nom: 'Fragment de relique', pluriel: 'fragments de relique', auto: { dossier: 'recompenses-activites/epreuve/sentinelles', mots: ['fragment'] }, prestige: 35, icone: 'Puzzle' },
  parchemin: { nom: 'Parchemin du Destin', pluriel: 'parchemins du Destin', auto: { dossier: 'inventaire', mots: ['parchemin'] }, prestige: 30, icone: 'ScrollText',
    description: 'Élimine une contrainte durant une Expédition, une Épopée ou une Prophétie. Il se consomme au moment de soumettre ton coloriage.' },
};

// Objets qu'on garde dans son inventaire pour s'en servir (ce ne sont pas des badges)
export const OBJETS = ['parchemin'];

// Nombre de badges affichés sur le profil (2 rangées de 3) et d'épingles permises
export const MAX_EPINGLES = 6;

// Images d'une récompense trouvées automatiquement : celles de son dossier dont le nom contient un de ses mots
const sansAccents = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function imagesDe(genre) {
  const a = RECOMPENSES[genre]?.auto;
  if (!a) return [];
  return IMAGES.filter((i) => i.chemin.startsWith(`/${a.dossier}/`))
    .filter((i) => { const f = sansAccents(i.fichier); return a.mots.some((m) => f.includes(m)) && !(a.exclure || []).some((m) => f.includes(m)); });
}

// Variante voulue (ex. sceau 3, boussole 2, insigne « ambiance ») : un numéro ou un mot tiré de l'image enregistrée
const ALIAS = { creatif: 'libre' }; // tournoi créatif : fichier « …tournoi-libre… »
function choisirVariante(liste, indice) {
  if (!liste.length) return null;
  const t = sansAccents(indice).replace(/\.[a-z0-9]+$/, '');
  const n = (t.match(/\d+/) || [])[0];
  if (n) {
    const parNumero = liste.find((i) => new RegExp(`(^|\\D)${n}(\\D|$)`).test(i.fichier));
    if (parNumero) return parNumero;
  }
  const mots = t.split(/[^a-z]+/).filter((m) => m.length > 2).map((m) => ALIAS[m] || m);
  return liste.find((i) => mots.some((m) => sansAccents(i.fichier).includes(m))) || liste[0];
}

// Sceaux des épreuves de chef.fe : tous les fichiers « …sceau… » du dossier epreuve/chef, numérotés
export const NUMEROS_SCEAUX = [...new Set(imagesDe('sceau').map((i) => Number((i.fichier.match(/\d+/) || [])[0])).filter(Boolean))].sort((a, b) => a - b);
export const imageSceau = (n) => choisirVariante(imagesDe('sceau'), String(n || 1))?.chemin || null;

// Chemin de l'image d'une récompense : le fichier propre choisi dans l'espace admin s'il existe,
// sinon l'image trouvée automatiquement dans son dossier (avec sa variante), sinon null (une icône la remplace)
export function imageRecompense(r) {
  const c = RECOMPENSES[r.genre];
  if (!c) return null;
  const liste = imagesDe(r.genre);
  const propre = String(r.image || '').trim();
  if (propre) {
    const exact = IMAGES.find((i) => i.fichier === propre || i.fichier === `${propre}.png` || i.fichier.replace(/\.[a-z0-9]+$/i, '') === propre.replace(/\.[a-z0-9]+$/i, ''));
    if (exact && exact.chemin.startsWith(`/${c.auto.dossier}/`)) return exact.chemin;
  }
  return choisirVariante(liste, propre)?.chemin || null;
}

// « Sceau de @marie », ou « 2 sceaux de @marie »
export function nomRecompense(r, nombre = 1) {
  const c = RECOMPENSES[r.genre];
  if (!c) return r.detail || '';
  const base = nombre > 1 ? `${nombre} ${c.pluriel}` : c.nom;
  return r.detail ? `${base} ${r.detail}` : base;
}

// Regroupe les récompenses identiques (même type et même détail), les plus prestigieuses en premier
export function regrouperRecompenses(liste) {
  const groupes = new Map();
  for (const r of liste) {
    const cle = `${r.genre}|${r.detail}`;
    if (!groupes.has(cle)) groupes.set(cle, { ...r, nombre: 0 });
    groupes.get(cle).nombre++;
  }
  return [...groupes.values()].sort((a, b) =>
    (RECOMPENSES[b.genre]?.prestige || 0) - (RECOMPENSES[a.genre]?.prestige || 0) || new Date(b.cree_le) - new Date(a.cree_le));
}

// Badge de Pionnière, Pionnier ou Pionnier.ère, à ajouter en tête des récompenses d'un membre Pionnier
// (l'Invocatrice l'a aussi, même si elle ne porte pas le nom)
export function badgePionnier(membre) {
  if (!membre?.pionnier && membre?.role !== 'admin') return [];
  return [{ id: 'pionnier', genre: 'pionnier', detail: `de ${nomPionnier(membre.genre)}`, source: 'pionnier' }];
}
