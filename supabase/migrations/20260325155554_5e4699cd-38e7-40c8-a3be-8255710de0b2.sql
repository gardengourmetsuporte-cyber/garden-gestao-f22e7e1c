UPDATE order_items oi
SET unit_price = ii.unit_price
FROM inventory_items ii
WHERE oi.item_id = ii.id
AND (oi.unit_price IS NULL OR oi.unit_price = 0)
AND ii.unit_price IS NOT NULL AND ii.unit_price > 0;