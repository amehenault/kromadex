-- Pop-up « Bravo, tu as gagné … XP » : les gains pas encore montrés (les gains passés comptent comme vus)
alter table xp_journal add column if not exists vu boolean not null default true;
alter table xp_journal alter column vu set default false
