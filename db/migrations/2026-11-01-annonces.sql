create table if not exists annonces_envoyees (
  cle text primary key,
  envoye_le timestamptz not null default now()
);
