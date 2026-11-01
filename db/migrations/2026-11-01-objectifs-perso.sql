create table if not exists objectifs_perso (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  texte text not null default '',
  tome text not null default '',
  page_no text not null default '',
  cree_le timestamptz not null default now(),
  termine_le timestamptz
);
create index if not exists objectifs_perso_user on objectifs_perso (user_id, termine_le);
