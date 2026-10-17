// Types de demandes de la page Aide
export const TYPES_DEMANDE = [
  { valeur: 'question', label: 'Poser une question', court: 'Question' },
  { valeur: 'bug', label: 'Signaler un bug', court: 'Bug' },
  { valeur: 'tome', label: "Demander l'ajout d'un tome ou d'un livre", court: 'Ajout de tome' },
  { valeur: 'crayons', label: "Demander l'ajout de crayons", court: 'Ajout de crayons' },
  { valeur: 'fonctionnalite', label: 'Proposer une fonctionnalité', court: 'Fonctionnalité' },
];

// Demandes créées par l'application (pas proposées dans la page Aide)
const TYPES_INTERNES = { motdepasse: 'Mot de passe oublié' };

export const nomType = (v) => TYPES_DEMANDE.find((t) => t.valeur === v)?.court || TYPES_INTERNES[v] || v;

// Les 3 catégories de l'onglet Demandes, avec les statuts possibles de chacune
export const GROUPES_DEMANDE = [
  { cle: 'questions', label: 'Questions et bugs', types: ['question', 'bug', 'motdepasse'], statuts: ['nouvelle', 'en_cours', 'resolue'] },
  { cle: 'ajouts', label: 'Ajouts de tomes et crayons', types: ['tome', 'crayons'], statuts: ['nouvelle', 'en_cours', 'ajoutee', 'refusee'] },
  { cle: 'fonctionnalites', label: 'Fonctionnalités', types: ['fonctionnalite'], statuts: ['nouvelle', 'en_cours', 'ajoutee', 'refusee'] },
];
export const groupeDuType = (type) => GROUPES_DEMANDE.find((g) => g.types.includes(type)) || GROUPES_DEMANDE[0];

export const STATUTS_DEMANDE = [
  { valeur: 'nouvelle', label: 'Nouvelle' },
  { valeur: 'en_cours', label: 'En cours' },
  { valeur: 'resolue', label: 'Résolue' },
  { valeur: 'ajoutee', label: 'Ajoutée' },
  { valeur: 'refusee', label: 'Refusée' },
];
export const nomStatut = (v) => STATUTS_DEMANDE.find((s) => s.valeur === v)?.label || v;

// Résolues, ajoutées et refusées sont archivées (jamais supprimées)
export const STATUTS_ARCHIVES = ['resolue', 'ajoutee', 'refusee'];
export const estArchivee = (statut) => STATUTS_ARCHIVES.includes(statut);
