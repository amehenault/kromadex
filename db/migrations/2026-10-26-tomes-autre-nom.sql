alter table tome_catalog add column if not exists autre_nom text not null default '';

INSERT INTO user_tomes (user_id, tome_id)
SELECT u.user_id, fr.id
FROM (VALUES
  ('9782295017598', 'coco-girl-moments-coloring-book-vol-1-penguin-edition'),
  ('9782295017499', 'coco-cozy-days-coloring-book'),
  ('9782295017581', 'coco-cozy-friends-coloring-book-penguin-edition'),
  ('9782295017949', 'coco-cozy-season-coloring-book'),
  ('9782295017673', 'coco-spooky-cutie-coloring-book-penguin-random-house-edition'),
  ('9782295017482', 'coco-cozy-vibes-coloring-book'),
  ('9782295017154', 'coco-cozy-christmas-coloring-book'),
  ('9782295016669', 'coco-cozy-corner-coloring-book-spiral-bound-penguin-edition')
) AS v(fr, en)
JOIN tome_catalog fr ON fr.ean = v.fr
JOIN tome_catalog en ON en.ean = v.en
JOIN user_tomes u ON u.tome_id = en.id
ON CONFLICT DO NOTHING;

DELETE FROM tome_catalog WHERE ean IN (
  'coco-girl-moments-coloring-book-vol-1-penguin-edition', 'coco-cozy-days-coloring-book',
  'coco-cozy-friends-coloring-book-penguin-edition', 'coco-cozy-season-coloring-book',
  'coco-spooky-cutie-coloring-book-penguin-random-house-edition', 'coco-cozy-vibes-coloring-book',
  'coco-cozy-christmas-coloring-book', 'coco-cozy-corner-coloring-book-spiral-bound-penguin-edition'
);
