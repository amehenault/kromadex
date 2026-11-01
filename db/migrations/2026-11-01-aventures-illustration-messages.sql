alter table aventures add column if not exists illustration_b64 text;
alter table aventures add column if not exists illustration_type text;
alter table aventures add column if not exists illustration_maj timestamptz;
alter table aventures add column if not exists message_fin text not null default '';
alter table aventures add column if not exists nb_coloriages int not null default 1;
alter table aventure_etapes add column if not exists message text not null default '';
alter table aventures add column if not exists instructions text not null default '';
