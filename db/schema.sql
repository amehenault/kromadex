create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default '',
  tome text not null default '',
  page_no text not null default '',
  category text not null default '',
  difficulty int not null default 0 check (difficulty between 0 and 5),
  rating int not null default 0 check (rating between 0 and 5),
  codes jsonb not null default '[]',
  image_b64 text,
  image_type text,
  created_at timestamptz not null default now()
);
create index if not exists pages_user_idx on pages (user_id, created_at desc)
;
create table if not exists tome_catalog (
  id serial primary key,
  ean text unique not null,
  titre text not null,
  editeur text not null default '',
  collection text not null default '',
  nb_pages int,
  couverture text,
  url text
);
create table if not exists user_tomes (
  user_id text not null,
  tome_id int not null references tome_catalog(id) on delete cascade,
  primary key (user_id, tome_id)
)
;
alter table tome_catalog add column if not exists nom text;
alter table tome_catalog add column if not exists type text not null default 'mystere'
;
alter table user_tomes add column if not exists pages_coloriees int;
alter table users add column if not exists types_pratiques text[] not null default '{}';
alter table users add column if not exists types_vus text[] not null default '{}'
;
alter table pages add column if not exists memo text not null default ''
;
create table if not exists user_tomes_masques (
  user_id text not null,
  nom text not null,
  primary key (user_id, nom)
);
create table if not exists tomes_perso (
  user_id text not null,
  nom text not null,
  nb_pages int,
  primary key (user_id, nom)
)
;
create table if not exists defis (
  id serial primary key,
  mois date unique not null,
  titre text not null,
  description text not null default '',
  choisi_par uuid,
  cree_le timestamptz not null default now()
);
create table if not exists missives (
  id serial primary key,
  titre text not null,
  contenu text not null default '',
  auteur uuid,
  cree_le timestamptz not null default now()
);
create table if not exists missives_lues (
  user_id uuid not null,
  missive_id int not null references missives(id) on delete cascade,
  primary key (user_id, missive_id)
);
create table if not exists bingos (
  id serial primary key,
  titre text not null,
  cases text[] not null,
  debut date,
  fin date,
  cree_le timestamptz not null default now()
);
create table if not exists quetes (
  id serial primary key,
  fete text not null,
  titre text not null,
  description text not null default '',
  etapes text[] not null default '{}',
  xp int not null default 0,
  debut date,
  fin date,
  active boolean not null default true,
  cree_le timestamptz not null default now()
)
;
alter table users add column if not exists avatar_b64 text;
alter table users add column if not exists avatar_type text;
alter table users add column if not exists avatar_maj timestamptz;
alter table users add column if not exists suspendu_jusqu timestamptz;
alter table missives add column if not exists statut text not null default 'publiee';
create table if not exists demandes (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  message text not null,
  reponse text not null default '',
  statut text not null default 'nouvelle',
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create table if not exists avertissements (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  par uuid,
  motif text not null,
  suspension_jours int not null default 0,
  lu boolean not null default false,
  cree_le timestamptz not null default now()
)
;
alter table demandes add column if not exists reponse_vue boolean not null default true
;
alter table pages add column if not exists publiee boolean not null default false;
alter table pages add column if not exists type_coloriage text not null default '';
alter table pages add column if not exists publiee_le timestamptz;
create index if not exists pages_publiees_idx on pages (publiee_le desc) where publiee;
create table if not exists page_likes (
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  primary key (user_id, page_id)
);
alter table missives add column if not exists commentaires boolean not null default true;
create table if not exists missive_likes (
  user_id uuid not null references users(id) on delete cascade,
  missive_id int not null references missives(id) on delete cascade,
  primary key (user_id, missive_id)
);
create table if not exists missive_commentaires (
  id serial primary key,
  missive_id int not null references missives(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  texte text not null,
  cree_le timestamptz not null default now()
)
