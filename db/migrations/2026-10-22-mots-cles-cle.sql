alter table mots_cles add column if not exists cle text;
create unique index if not exists mots_cles_cle_unique on mots_cles (tome_id, page_no, cle)
