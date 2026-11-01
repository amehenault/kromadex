create table if not exists avis_tomes (
  tome_id int not null references tome_catalog(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  note int not null check (note between 1 and 5),
  avis text not null default '',
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now(),
  primary key (tome_id, user_id)
);
