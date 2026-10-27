
INSERT INTO marker_brands (brand_name, range_name, category, sub_type, created_by)
SELECT 'Flysea', 'Set de 504 (432 Brush + 72 pointes fines)', 'feutre', 'Acrylique Brush et pointe fine', NULL
WHERE NOT EXISTS (SELECT 1 FROM marker_brands WHERE brand_name = 'Flysea' AND range_name = 'Set de 504 (432 Brush + 72 pointes fines)' AND created_by IS NULL);

INSERT INTO marker_colors (brand_id, color_code, color_name, hex_value)
SELECT n.id, c.color_code,
       CASE WHEN s.range_name LIKE '%pointe fine%' THEN concat_ws(' · ', 'Pointe fine', c.color_name) ELSE c.color_name END,
       c.hex_value
FROM marker_brands n
JOIN marker_brands s ON s.brand_name = 'Flysea' AND s.created_by IS NULL
  AND s.range_name IN ('Set de 432', 'Set de 72 pointe fine (inclus dans le 504)')
JOIN marker_colors c ON c.brand_id = s.id
WHERE n.brand_name = 'Flysea' AND n.range_name = 'Set de 504 (432 Brush + 72 pointes fines)' AND n.created_by IS NULL
  AND NOT EXISTS (SELECT 1 FROM marker_colors m WHERE m.brand_id = n.id)
ORDER BY s.id, c.id;

DELETE FROM marker_colors WHERE brand_id IN (
  SELECT id FROM marker_brands WHERE brand_name = 'Flysea' AND range_name = 'Set de 72 pointe fine (inclus dans le 504)' AND created_by IS NULL
    AND NOT EXISTS (SELECT 1 FROM user_sets u WHERE u.brand_id = marker_brands.id));

DELETE FROM marker_brands WHERE brand_name = 'Flysea' AND range_name = 'Set de 72 pointe fine (inclus dans le 504)' AND created_by IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_sets u WHERE u.brand_id = marker_brands.id)
  AND NOT EXISTS (SELECT 1 FROM marker_colors c WHERE c.brand_id = marker_brands.id)
