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
;
create table if not exists abonnements (
  suiveur uuid not null references users(id) on delete cascade,
  suivi uuid not null references users(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (suiveur, suivi),
  check (suiveur <> suivi)
);
create index if not exists abonnements_suivi_idx on abonnements (suivi);
alter table defis add column if not exists genre text not null default 'officiel';
alter table defis add column if not exists categorie text not null default 'tous';
alter table defis add column if not exists debut date;
alter table defis add column if not exists fin date;
alter table defis drop constraint if exists defis_mois_key;
create unique index if not exists defis_officiel_mois on defis (mois) where genre = 'officiel';
create unique index if not exists defis_modo_mois on defis (mois, choisi_par) where genre = 'modo';
create table if not exists defi_participations (
  defi_id int not null references defis(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  page_id uuid references pages(id) on delete set null,
  cree_le timestamptz not null default now(),
  primary key (defi_id, user_id)
);
create table if not exists bingo_cases (
  bingo_id int not null references bingos(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  case_no int not null check (case_no between 0 and 24),
  page_id uuid references pages(id) on delete set null,
  cree_le timestamptz not null default now(),
  primary key (bingo_id, user_id, case_no)
)
;
create table if not exists nouveautes (
  id serial primary key,
  categorie text not null default 'nouvelles',
  titre text not null,
  resume text not null default '',
  contenu text not null default '',
  auteur uuid,
  publie_le timestamptz not null default now()
);
create table if not exists connexions (
  user_id uuid not null references users(id) on delete cascade,
  jour date not null,
  primary key (user_id, jour)
);
create table if not exists xp_journal (
  user_id uuid not null references users(id) on delete cascade,
  cle text not null,
  xp int not null,
  cree_le timestamptz not null default now(),
  primary key (user_id, cle)
)
;
alter table users add column if not exists genre text not null default 'masculin'
;
alter table users add column if not exists bio text not null default ''
;
create table if not exists page_commentaires (
  id serial primary key,
  page_id uuid not null references pages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_id int references page_commentaires(id) on delete cascade,
  texte text not null,
  cree_le timestamptz not null default now()
);
create index if not exists page_commentaires_page_idx on page_commentaires (page_id, cree_le);
alter table page_likes add column if not exists cree_le timestamptz not null default now();
create table if not exists vues (
  user_id uuid not null references users(id) on delete cascade,
  genre text not null,
  cible text not null,
  cree_le timestamptz not null default now(),
  primary key (user_id, genre, cible)
);
create table if not exists quete_etapes (
  user_id uuid not null references users(id) on delete cascade,
  quete_id int not null references quetes(id) on delete cascade,
  etape int not null,
  primary key (user_id, quete_id, etape)
)
;
create table if not exists combats (
  id serial primary key,
  createur uuid not null references users(id) on delete cascade,
  page_a uuid not null references pages(id) on delete cascade,
  invite uuid references users(id) on delete cascade,
  adversaire uuid references users(id) on delete cascade,
  page_b uuid references pages(id) on delete cascade,
  statut text not null default 'ouvert',
  fin timestamptz,
  gagnant uuid,
  cree_le timestamptz not null default now()
);
create table if not exists combat_votes (
  combat_id int not null references combats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  choix text not null check (choix in ('a', 'b')),
  primary key (combat_id, user_id)
)
;
create table if not exists reinitialisations (
  jeton_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expire_le timestamptz not null,
  utilise boolean not null default false,
  cree_le timestamptz not null default now()
)
;
alter table bingos add column if not exists conditions text[] not null default '{}';
alter table bingos add column if not exists categorie text not null default 'les_deux'
;
create unique index if not exists defis_cheffe_mois on defis (mois, choisi_par) where genre = 'cheffe';
create unique index if not exists defis_groupe_mois on defis (mois, choisi_par) where genre = 'groupe'
;
alter table users add column if not exists cheffe_depuis timestamptz
;
alter table users add column if not exists pays text not null default 'ca-qc'
;
create table if not exists mots_cles (
  id serial primary key,
  tome_id int not null references tome_catalog(id) on delete cascade,
  page_no text not null default '',
  mot text not null,
  user_id uuid references users(id) on delete set null,
  cree_le timestamptz not null default now()
);
create unique index if not exists mots_cles_unique on mots_cles (tome_id, page_no, lower(mot));
create index if not exists mots_cles_mot_idx on mots_cles (lower(mot));
create table if not exists mot_cle_signalements (
  mot_cle_id int not null references mots_cles(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  raison text not null check (raison in ('repetition', 'faux', 'inapproprie')),
  cree_le timestamptz not null default now(),
  primary key (mot_cle_id, user_id)
)
