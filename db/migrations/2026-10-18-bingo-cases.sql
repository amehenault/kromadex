alter table bingos add column if not exists styles jsonb not null default '[]';
create table if not exists bingo_images (
  bingo_id int not null references bingos(id) on delete cascade,
  case_no int not null,
  image_b64 text not null,
  type text not null default 'image/webp',
  maj_le timestamptz not null default now(),
  primary key (bingo_id, case_no)
);
