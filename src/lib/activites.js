// Règles des activités ludiques : XP, durées et récompenses, réunies au même endroit.

// Épreuves : XP de participation (coloriage envoyé) et bonus de la personne gagnante
export const XP_EPREUVES = {
  officiel: { participation: 200, victoire: 100 },
  modo: { participation: 175, victoire: 75 },
  cheffe: { participation: 135, victoire: 35 },
};
// Épreuve de groupe : 150 XP chacun si l'objectif est atteint, sinon 10 XP de participation ;
// 5 XP par coloriage supplémentaire quand plusieurs coloriages par personne sont permis
export const XP_GROUPE = { complete: 150, participation: 10, supplementaire: 5 };
// Relique : 4 fragments (gagnés aux épreuves des sentinelles) complètent une relique
export const FRAGMENTS_PAR_RELIQUE = 4;
export const XP_RELIQUE = 400;

// Bingo : 25 XP par ligne (3 lignes au maximum), 150 XP pour la grille complète,
// 10 XP par case de plus remplie avec un même coloriage, 150 XP si un coloriage remplit toute la grille
export const XP_BINGO = { ligne: 25, lignesMax: 3, grille: 150, caseEnPlus: 10, toutEnUn: 150 };

// Combats
export const COMBATS = {
  joursSoumission: 12, // pour soumettre son coloriage, sinon le combat est annulé
  joursVerdict: 5, // pour l'Assemblée
  joursAcceptation: 5, // pour accepter un duel
  maxJoute: 4, // participants d'une joute
};
export const XP_COMBATS = {
  duel: { participation: 50, victoire: 150 },
  joute: { participation: 40, victoire: 100 },
};
export const VICTOIRES_EPEE = 5; // duels gagnés pour l'Épée chromatique
export const VICTOIRES_EXPERT_JOUTE = 5; // joutes gagnées pour le titre Expert de la joute
export const TITRE_EXPERT_JOUTE = 'Expert de la joute';
export const THEMES_DUEL = [
  { valeur: 'couleur', label: 'Couleur', aide: 'ex. un vert sapin' },
  { valeur: 'personnage', label: 'Personnage', aide: 'ex. Stitch' },
  { valeur: 'ambiance', label: 'Ambiance', aide: 'ex. une nuit étoilée' },
];

// Tournoi du royaume
export const TOURNOIS = {
  joursInscription: 7,
  joursSoumission: 5,
  joursVerdict: 3,
  heuresAttente: 72, // entre deux tournois
  tailles: [8, 16],
};
export const XP_TOURNOI = { participation: 35, ronde: 50, finale: 100, victoire: 150 };
export const GENRES_TOURNOI = [
  { valeur: 'creatif', label: 'Créatif', aide: 'Mode libre, sans contrainte' },
  { valeur: 'couleur', label: 'Couleur', aide: 'Utilisation massive d’une couleur' },
  { valeur: 'ambiance', label: 'Ambiance', aide: 'Sombre, joyeuse, festive…' },
];

// Expéditions : une par fête. Chaque fête dure une semaine, sauf octobre et décembre.
export const FETES = [
  { valeur: 'fevrier', mois: 2, nom: 'La fête des liens', occasion: 'Saint-Valentin', debut: '02-08', fin: '02-14', xp: 80 },
  { valeur: 'avril', mois: 4, nom: 'L’éveil du printemps', occasion: 'Pâques', debut: '04-01', fin: '04-07', xp: 80 },
  { valeur: 'juin', mois: 6, nom: 'Le solstice des couleurs', occasion: 'Début de l’été', debut: '06-18', fin: '06-24', xp: 80 },
  { valeur: 'octobre', mois: 10, nom: 'La nuit des ombres', occasion: 'Halloween', debut: '10-18', fin: '10-31', xp: 150 },
  { valeur: 'decembre', mois: 12, nom: 'La veillée des flocons', occasion: 'Noël et Jour de l’An', debut: '12-01', fin: '12-31', xp: 215 },
];
export const XP_SECONDAIRE = 10;
// Boussole : son visuel change à la 1re, à la 3e et à la 5e expédition réussie
export const PALIERS_BOUSSOLE = [1, 3, 5];

// Épopées : une par saison, deux semaines
export const MOIS_EPOPEES = [1, 3, 7, 9];
export const XP_EPOPEE = { phase1: 100, attaque: 100, victoire: 200, max: 400 };
export const DEGATS = {
  facile: { label: 'Facile', min: 100, max: 200 },
  intermediaire: { label: 'Intermédiaire', min: 300, max: 500 },
  difficile: { label: 'Difficile', min: 600, max: 800 },
};

// Prophéties : une par année, en mai ou en novembre, 3 étapes d'une semaine
export const MOIS_PROPHETIES = [5, 11];
export const XP_PROPHETIE = { etape: 150, complet: 300 };

export const NOMS_AVENTURES = {
  expedition: { singulier: 'Expédition', pluriel: 'Expéditions', une: 'une nouvelle expédition' },
  epopee: { singulier: 'Épopée', pluriel: 'Épopées', une: 'une nouvelle épopée' },
  prophetie: { singulier: 'Prophétie', pluriel: 'Prophéties', une: 'une nouvelle prophétie' },
};

// Message affiché chaque fois qu'on soumet un coloriage à une activité
export const AVERTISSEMENT_SOUMISSION =
  'En soumettant ce coloriage, tu t’assures qu’il correspond à tous les critères, sans quoi tu risques de perdre le double des points et de voir ton coloriage supprimé, en plus de risquer une suspension.';
