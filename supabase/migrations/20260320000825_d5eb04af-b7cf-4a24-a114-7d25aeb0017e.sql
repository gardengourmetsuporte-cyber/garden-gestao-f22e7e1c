-- Ensure ingredient costs are recalculated when inventory base unit OR price changes
DROP TRIGGER IF EXISTS on_inventory_price_change ON public.inventory_items;

CREATE TRIGGER on_inventory_price_change
AFTER UPDATE OF unit_price, unit_type, recipe_unit_price, recipe_unit_type ON public.inventory_items
FOR EACH ROW
WHEN (
  OLD.unit_price IS DISTINCT FROM NEW.unit_price
  OR OLD.unit_type IS DISTINCT FROM NEW.unit_type
  OR OLD.recipe_unit_price IS DISTINCT FROM NEW.recipe_unit_price
  OR OLD.recipe_unit_type IS DISTINCT FROM NEW.recipe_unit_type
)
EXECUTE FUNCTION public.sync_recipe_costs_on_item_price_change();

-- Backfill all inventory-based ingredient costs to fix historical stale values
UPDATE public.recipe_ingredients ri
SET
  unit_cost = COALESCE(ii.unit_price, 0),
  total_cost = (
    CASE
      WHEN ii.unit_type::text = ri.unit_type::text THEN
        ri.quantity * COALESCE(ii.unit_price, 0)
      WHEN ii.unit_type::text = 'kg' AND ri.unit_type::text = 'g' THEN
        (ri.quantity / 1000) * COALESCE(ii.unit_price, 0)
      WHEN ii.unit_type::text = 'g' AND ri.unit_type::text = 'kg' THEN
        (ri.quantity * 1000) * COALESCE(ii.unit_price, 0)
      WHEN ii.unit_type::text = 'litro' AND ri.unit_type::text = 'ml' THEN
        (ri.quantity / 1000) * COALESCE(ii.unit_price, 0)
      WHEN ii.unit_type::text = 'ml' AND ri.unit_type::text = 'litro' THEN
        (ri.quantity * 1000) * COALESCE(ii.unit_price, 0)
      ELSE
        ri.quantity * COALESCE(ii.unit_price, 0)
    END
  )
FROM public.inventory_items ii
WHERE ri.item_id = ii.id
  AND ri.source_type = 'inventory';

-- Recompute recipe totals after ingredient backfill
WITH recipe_totals AS (
  SELECT
    ri.recipe_id,
    COALESCE(SUM(ri.total_cost), 0) AS total_cost
  FROM public.recipe_ingredients ri
  GROUP BY ri.recipe_id
)
UPDATE public.recipes r
SET
  total_cost = rt.total_cost,
  cost_per_portion = CASE
    WHEN COALESCE(r.yield_quantity, 0) > 0 THEN rt.total_cost / r.yield_quantity
    ELSE rt.total_cost
  END,
  cost_updated_at = now(),
  updated_at = now()
FROM recipe_totals rt
WHERE r.id = rt.recipe_id;

-- Keep recipes without ingredients consistent
UPDATE public.recipes r
SET
  total_cost = 0,
  cost_per_portion = 0,
  cost_updated_at = now(),
  updated_at = now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.recipe_ingredients ri
  WHERE ri.recipe_id = r.id
);