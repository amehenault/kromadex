import { nomPionnier } from '@/lib/postes';
import IMAGES from '@/lib/manifesteRecompenses.json';

export const DOSSIER_RECOMPENSES = '/recompenses-activites';

export const RECOMPENSES = {
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

export const OBJETS = ['parchemin'];

export const MAX_EPINGLES = 6;

const sansAccents = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function imagesDe(genre) {
  const a = RECOMPENSES[genre]?.auto;
  if (!a) return [];
  return IMAGES.filter((i) => i.chemin.startsWith(`/${a.dossier}/`))
    .filter((i) => { const f = sansAccents(i.fichier); return a.mots.some((m) => f.includes(m)) && !(a.exclure || []).some((m) => f.includes(m)); });
}

const ALIAS = { creatif: 'libre' };
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

export const NUMEROS_SCEAUX = [...new Set(imagesDe('sceau').map((i) => Number((i.fichier.match(/\d+/) || [])[0])).filter(Boolean))].sort((a, b) => a - b);
export const imageSceau = (n) => choisirVariante(imagesDe('sceau'), String(n || 1))?.chemin || null;

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

export function nomRecompense(r, nombre = 1) {
  const c = RECOMPENSES[r.genre];
  if (!c) return r.detail || '';
  const base = nombre > 1 ? `${nombre} ${c.pluriel}` : c.nom;
  return r.detail ? `${base} ${r.detail}` : base;
}

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

export function badgePionnier(membre) {
  if (!membre?.pionnier && membre?.role !== 'admin') return [];
  return [{ id: 'pionnier', genre: 'pionnier', detail: `de ${nomPionnier(membre.genre)}`, source: 'pionnier' }];
}
