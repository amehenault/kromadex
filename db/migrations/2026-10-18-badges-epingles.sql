alter table users add column if not exists badges_epingles jsonb not null default '[]';
