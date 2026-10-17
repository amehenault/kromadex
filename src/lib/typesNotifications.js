// Types de notifications push, réglables un par un dans Paramètres.
// postes : seulement proposé à ces postes (absent = tout le monde)
export const TYPES_NOTIFS = [
  { cle: 'missives', label: 'Nouvelles missives' },
  { cle: 'reponses', label: 'Réponses à mes demandes d’aide' },
  { cle: 'combats', label: 'Invitations à un combat' },
  { cle: 'abonnement', label: 'Mon abonnement Kromadex+' },
  { cle: 'demandes', label: 'Nouvelles demandes dans Aide', postes: ['admin'] },
  { cle: 'missivesAttente', label: 'Missives de Sentinelles à approuver', postes: ['admin'] },
  { cle: 'rappels', label: 'Activités à planifier (chaque matin)', postes: ['admin'] },
  { cle: 'validation', label: 'Cases de bingo à valider', postes: ['admin', 'modo'] },
  { cle: 'signalements', label: 'Coloriages et mots-clefs signalés', postes: ['admin', 'modo'] },
];

export const typesPour = (role) => TYPES_NOTIFS.filter((t) => !t.postes || t.postes.includes(role));
