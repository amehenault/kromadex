// Types de demandes de la page Aide
export const TYPES_DEMANDE = [
  { valeur: 'question', label: 'Poser une question', court: 'Question' },
  { valeur: 'bug', label: 'Signaler un bug', court: 'Bug' },
  { valeur: 'tome', label: "Demander l'ajout d'un tome ou d'un livre", court: 'Ajout de tome' },
  { valeur: 'crayons', label: "Demander l'ajout de crayons", court: 'Ajout de crayons' },
  { valeur: 'fonctionnalite', label: 'Proposer une fonctionnalité', court: 'Fonctionnalité' },
];

export const STATUTS_DEMANDE = [
  { valeur: 'nouvelle', label: 'Nouvelle' },
  { valeur: 'en_cours', label: 'En cours' },
  { valeur: 'traitee', label: 'Traitée' },
  { valeur: 'refusee', label: 'Refusée' },
];

export const nomType = (v) => TYPES_DEMANDE.find((t) => t.valeur === v)?.court || v;
export const nomStatut = (v) => STATUTS_DEMANDE.find((s) => s.valeur === v)?.label || v;
