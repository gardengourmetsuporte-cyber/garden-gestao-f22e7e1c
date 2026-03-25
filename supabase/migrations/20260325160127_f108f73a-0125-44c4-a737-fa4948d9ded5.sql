UPDATE order_items oi
SET unit_price = sub.survey_price
FROM (
  SELECT DISTINCT ON (psr.item_id) psr.item_id, psr.unit_price as survey_price
  FROM price_survey_responses psr
  WHERE psr.has_item = true AND psr.unit_price > 0
  ORDER BY psr.item_id, psr.created_at DESC
) sub
WHERE oi.item_id = sub.item_id
AND (oi.unit_price IS NULL OR oi.unit_price = 0);