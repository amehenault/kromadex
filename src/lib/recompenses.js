// Catalogue des récompenses des activités (utilisable dans le navigateur et sur le serveur).
//
// Les images se trouvent dans public/recompenses-activites, un dossier par type d'activité.
// Nom de fichier attendu (en .png) : par exemple epreuve/chef/sceau-3.png ou combat/epee.png.
// Une récompense peut aussi avoir sa propre image (ex. le badge d'une épreuve, le blason d'une épopée) :
// c'est le nom de fichier saisi dans l'espace admin, cherché dans le dossier de la récompense.
// Tant que l'image n'existe pas, une icône la remplace.
export const DOSSIER_RECOMPENSES = '/recompenses-activites';

export const RECOMPENSES = {
  relique: { nom: 'Relique', pluriel: 'reliques', dossier: 'epreuve/sentinelles', fichier: 'relique', prestige: 100, icone: 'Crown' },
  coffre: { nom: 'Coffre au trésor', pluriel: 'coffres au trésor', dossier: 'epreuve/mensuelles', fichier: 'coffre', prestige: 95, icone: 'Gem' },
  insigne: { nom: 'Insigne du tournoi', pluriel: 'insignes du tournoi', dossier: 'combat', fichier: 'insigne', prestige: 90, icone: 'Medal' },
  blason: { nom: 'Blason', pluriel: 'blasons', dossier: 'autres-activites', fichier: 'blason', prestige: 85, icone: 'Shield' },
  orbe: { nom: 'Orbe magique', pluriel: 'orbes magiques', dossier: 'autres-activites', fichier: 'orbe', prestige: 80, icone: 'Sparkles' },
  badge_epreuve: { nom: 'Badge du mois', pluriel: 'badges du mois', dossier: 'epreuve/mensuelles', fichier: 'badge', prestige: 75, icone: 'Award' },
  epee: { nom: 'Épée chromatique', pluriel: 'épées chromatiques', dossier: 'combat', fichier: 'epee', prestige: 70, icone: 'Sword' },
  sceau: { nom: 'Sceau', pluriel: 'sceaux', dossier: 'epreuve/chef', fichier: 'sceau', prestige: 65, icone: 'Stamp' },
  badge_sentinelle: { nom: 'Badge de sentinelle', pluriel: 'badges de sentinelle', dossier: 'epreuve/sentinelles', fichier: 'badge', prestige: 60, icone: 'BadgeCheck' },
  boussole: { nom: 'Boussole', pluriel: 'boussoles', dossier: 'expedition', fichier: 'boussole', prestige: 55, icone: 'Compass' },
  joute: { nom: 'Joute', pluriel: 'joutes', dossier: 'combat', fichier: 'joute', prestige: 45, icone: 'Swords' },
  fragment: { nom: 'Fragment de relique', pluriel: 'fragments de relique', dossier: 'epreuve/sentinelles', fichier: 'fragment', prestige: 35, icone: 'Puzzle' },
  parchemin: { nom: 'Parchemin du Destin', pluriel: 'parchemins du Destin', dossier: 'autres-activites', fichier: 'parchemin', prestige: 30, icone: 'ScrollText' },
};

// Chemin de l'image d'une récompense (image propre ou image par défaut du type)
export function imageRecompense(r) {
  const c = RECOMPENSES[r.genre];
  if (!c) return null;
  const fichier = (r.image || '').trim() || `${c.fichier}.png`;
  return `${DOSSIER_RECOMPENSES}/${c.dossier}/${/\.[a-z0-9]+$/i.test(fichier) ? fichier : `${fichier}.png`}`;
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
