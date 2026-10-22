-- Mots-clefs : clé de comparaison (minuscules, sans accents, au singulier, lib/cleMot.js).
-- Une seule fois le même mot par page de tome, quelle que soit la personne qui l'ajoute (Lapin = lapin = Lapins).
-- Après cette migration : node --env-file=.env.local scripts/mots-cles-cles.mjs (remplit la clé des mots existants)
alter table mots_cles add column if not exists cle text;
create unique index if not exists mots_cles_cle_unique on mots_cles (tome_id, page_no, cle)
