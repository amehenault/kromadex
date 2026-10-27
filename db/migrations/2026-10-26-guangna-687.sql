UPDATE marker_colors m SET color_name = 'Vert Vif', hex_value = '#68B641'
FROM marker_brands b
WHERE b.id = m.brand_id AND b.brand_name = 'Guangna' AND m.color_code = '687';
