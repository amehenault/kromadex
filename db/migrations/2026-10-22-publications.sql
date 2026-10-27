create table if not exists publications (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  genre text not null check (genre in ('question', 'en_cours')),
  texte text not null default '',
  page_id uuid references pages(id) on delete cascade,
  cree_le timestamptz not null default now()
);
create index if not exists publications_genre_date on publications (genre, cree_le desc);
create table if not exists publication_images (
  publication_id int not null references publications(id) on delete cascade,
  no int not null,
  image_b64 text not null,
  type text not null default 'image/webp',
  primary key (publication_id, no)
);
create table if not exists publication_likes (
  user_id uuid not null references users(id) on delete cascade,
  publication_id int not null references publications(id) on delete cascade,
  primary key (user_id, publication_id)
);
create table if not exists publication_commentaires (
  id serial primary key,
  publication_id int not null references publications(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_id int references publication_commentaires(id) on delete cascade,
  texte text not null,
  cree_le timestamptz not null default now()
);
create index if not exists publication_commentaires_pub on publication_commentaires (publication_id);
alter table signalements drop constraint if exists signalements_genre_check;
alter table signalements add constraint signalements_genre_check
  check (genre in ('coloriage', 'commentaire', 'commentaire_missive', 'membre', 'publication', 'commentaire_publication'))
