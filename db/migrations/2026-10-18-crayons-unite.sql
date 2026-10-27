create table if not exists crayons_unite (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  marque text not null,
  code text not null,
  hex text not null default '',
  cree_le timestamptz not null default now()
);
create index if not exists crayons_unite_user on crayons_unite (user_id);
