alter table xp_journal add column if not exists vu boolean not null default true;
alter table xp_journal alter column vu set default false
