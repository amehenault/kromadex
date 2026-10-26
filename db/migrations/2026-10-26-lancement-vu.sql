-- Dernière visite de l'onglet Lancement (Invocatrice) : les inscriptions arrivées depuis ont une pastille rouge.
-- Départ à maintenant pour ne pas compter toutes les inscriptions déjà vues.
alter table users add column if not exists lancement_vu timestamptz;
update users set lancement_vu = now() where role = 'admin' and lancement_vu is null;
