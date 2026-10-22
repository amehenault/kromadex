-- Nombre de pages d'un tome changé par l'Invocatrice dans son Espace : npm run db:tomes ne l'écrase plus
alter table tome_catalog add column if not exists nb_pages_manuel boolean not null default false
