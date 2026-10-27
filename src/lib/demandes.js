export const TYPES_DEMANDE = [
  { valeur: 'question', label: 'Poser une question', court: 'Question' },
  { valeur: 'bug', label: 'Signaler un bug', court: 'Bug' },
  { valeur: 'erreur_tome', label: 'Erreurs dans un tome ou un livre', court: 'Erreur de tome' },
  { valeur: 'erreur_crayons', label: 'Erreurs dans les coffrets de crayons', court: 'Erreur de crayons' },
  { valeur: 'tome', label: "Demander l'ajout d'un tome ou d'un livre", court: 'Ajout de tome' },
  { valeur: 'crayons', label: "Demander l'ajout de crayons", court: 'Ajout de crayons' },
  { valeur: 'fonctionnalite', label: 'Proposer une fonctionnalité', court: 'Fonctionnalité' },
];

const TYPES_INTERNES = { motdepasse: 'Mot de passe oublié' };

export const nomType = (v) => TYPES_DEMANDE.find((t) => t.valeur === v)?.court || TYPES_INTERNES[v] || v;

export const GROUPES_DEMANDE = [
  { cle: 'questions', label: 'Questions, bugs et erreurs', types: ['question', 'bug', 'erreur_tome', 'erreur_crayons', 'motdepasse'], statuts: ['nouvelle', 'en_cours', 'resolue'] },
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

export const STATUTS_ARCHIVES = ['resolue', 'ajoutee', 'refusee'];
export const JOURS_ARCHIVES = 30;
export const estArchivee = (statut) => STATUTS_ARCHIVES.includes(statut);
