create table if not exists reglages (
  cle text primary key,
  valeur jsonb not null,
  maj_le timestamptz not null default now()
);
