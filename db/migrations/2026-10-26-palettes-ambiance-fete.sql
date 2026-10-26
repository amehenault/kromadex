-- Palettes : une ambiance et une fête facultatives (clés de lib/themesPalettes.js, vide = aucune)
alter table palettes add column if not exists ambiance text not null default '';
alter table palettes add column if not exists fete text not null default '';
