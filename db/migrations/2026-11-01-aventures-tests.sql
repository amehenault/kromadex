create table if not exists aventure_tests (
  id serial primary key,
  aventure_id int not null references aventures(id) on delete cascade,
  etape_id int not null references aventure_etapes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  contraintes int[] not null default '{}',
  degats int not null default 0,
  cree_le timestamptz not null default now()
);
create index if not exists aventure_tests_aventure on aventure_tests (aventure_id, user_id);
