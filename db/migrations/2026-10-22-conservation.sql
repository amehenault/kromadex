-- Demandes d'aide : date de fermeture (résolue, ajoutée, refusée), remise à vide si la demande est rouverte.
-- Le nettoyage automatique supprime la demande 30 jours après cette date.
alter table demandes add column if not exists ferme_le timestamptz;
update demandes set ferme_le = maj_le where ferme_le is null and statut in ('resolue', 'ajoutee', 'refusee');
create index if not exists demandes_ferme_le on demandes (ferme_le) where ferme_le is not null;
create index if not exists paiements_evenements_recu on paiements_evenements (recu_le)
