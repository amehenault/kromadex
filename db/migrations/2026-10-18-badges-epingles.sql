-- Badges épinglés sur le profil (6 au maximum, clés « genre|détail »), vide = les 6 plus récents
alter table users add column if not exists badges_epingles jsonb not null default '[]';
