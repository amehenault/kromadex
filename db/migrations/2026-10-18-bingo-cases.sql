-- Bingos : apparence de chaque case (couleur de fond et de texte), une entrée par case
alter table bingos add column if not exists styles jsonb not null default '[]';
-- Image de fond d'une case de bingo (réencodée en WebP par le serveur), servie à part pour garder la liste légère
create table if not exists bingo_images (
  bingo_id int not null references bingos(id) on delete cascade,
  case_no int not null,
  image_b64 text not null,
  type text not null default 'image/webp',
  maj_le timestamptz not null default now(),
  primary key (bingo_id, case_no)
);
