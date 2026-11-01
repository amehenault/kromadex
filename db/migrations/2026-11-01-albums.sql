create table if not exists albums (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  nom text not null,
  cree_le timestamptz not null default now()
);
create index if not exists albums_user on albums (user_id);
create table if not exists album_pages (
  album_id int not null references albums(id) on delete cascade,
  page_id uuid not null references pages(id) on delete cascade,
  ajoute_le timestamptz not null default now(),
  primary key (album_id, page_id)
);
