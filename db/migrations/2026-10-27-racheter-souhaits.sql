create table if not exists crayons_a_racheter (
  user_id uuid not null references users(id) on delete cascade,
  color_id int not null references marker_colors(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (user_id, color_id)
);

create table if not exists souhaits (
  id serial primary key,
  user_id uuid not null references users(id) on delete cascade,
  tome_id int references tome_catalog(id) on delete cascade,
  brand_id int references marker_brands(id) on delete cascade,
  cree_le timestamptz not null default now(),
  check ((tome_id is null) <> (brand_id is null))
);
create unique index if not exists souhaits_tome on souhaits (user_id, tome_id) where tome_id is not null;
create unique index if not exists souhaits_coffret on souhaits (user_id, brand_id) where brand_id is not null;
