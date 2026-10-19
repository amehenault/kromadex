-- Sondage dans une missive : 2 à 8 réponses, une ou plusieurs réponses permises, durée en heures (fin fixée à la publication)
alter table missives add column if not exists sondage_options text[] not null default '{}';
alter table missives add column if not exists sondage_multiple boolean not null default false;
alter table missives add column if not exists sondage_heures int;
alter table missives add column if not exists sondage_fin timestamptz;
-- Votes des sondages : une ligne par réponse choisie
create table if not exists missive_votes (
  missive_id int not null references missives(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  option_no int not null,
  cree_le timestamptz not null default now(),
  primary key (missive_id, user_id, option_no)
);
-- Ménestrelle : une épreuve par mois et par ménestrelle
create unique index if not exists defis_menestrel_mois on defis (mois, choisi_par) where genre = 'menestrel';
-- Bingos : qui l'a créé (une ménestrelle peut en créer un par mois)
alter table bingos add column if not exists createur uuid references users(id) on delete set null;
