-- Sondages terminés dont la personne a vu le résultat final (pop-up et pastille des missives)
create table if not exists sondages_vus (
  missive_id int not null references missives(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  primary key (missive_id, user_id)
);
