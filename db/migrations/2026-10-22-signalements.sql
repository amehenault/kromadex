-- Contenu signalé par un membre (règles d'utilisation) : coloriage publié, commentaire, commentaire de missive ou profil
create table if not exists signalements (
  id serial primary key,
  genre text not null check (genre in ('coloriage', 'commentaire', 'commentaire_missive', 'membre')),
  cible text not null,
  user_id uuid references users(id) on delete cascade,
  raison text not null,
  details text not null default '',
  cree_le timestamptz not null default now(),
  traite boolean not null default false,
  unique (genre, cible, user_id)
);
create index if not exists signalements_a_traiter on signalements (genre, cible) where not traite;
