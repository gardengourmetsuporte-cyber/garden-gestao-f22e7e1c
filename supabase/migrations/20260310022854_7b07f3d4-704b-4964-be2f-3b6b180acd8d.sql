
-- 1. Migrate recipe_unit data to unit_type/unit_price where recipe_unit was set
-- For items that have recipe_unit_type set (meaning they used a different unit for recipes),
-- we keep the base unit_type as-is but ensure unit_price reflects the price per base unit.
-- The new system uses unit_type + unit_price directly, so no migration of prices needed
-- since the trigger will use unit_type/unit_price going forward.

-- 2. Update the sync trigger to use only unit_type and unit_price
CREATE OR REPLACE FUNCTION public.sync_recipe_costs_on_item_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update all ingredients that use this item (using unit_type and unit_price only)
  UPDATE recipe_ingredients ri
  SET 
    unit_cost = COALESCE(NEW.unit_price, 0),
    total_cost = (
      CASE 
        -- Same units
        WHEN (NEW.unit_type::text = ri.unit_type::text) THEN
          ri.quantity * COALESCE(NEW.unit_price, 0)
        -- kg -> g
        WHEN (NEW.unit_type::text = 'kg' AND ri.unit_type::text = 'g') THEN
          (ri.quantity / 1000) * COALESCE(NEW.unit_price, 0)
        -- g -> kg
        WHEN (NEW.unit_type::text = 'g' AND ri.unit_type::text = 'kg') THEN
          (ri.quantity * 1000) * COALESCE(NEW.unit_price, 0)
        -- litro -> ml
        WHEN (NEW.unit_type::text = 'litro' AND ri.unit_type::text = 'ml') THEN
          (ri.quantity / 1000) * COALESCE(NEW.unit_price, 0)
        -- ml -> litro
        WHEN (NEW.unit_type::text = 'ml' AND ri.unit_type::text = 'litro') THEN
          (ri.quantity * 1000) * COALESCE(NEW.unit_price, 0)
        -- Fallback
        ELSE
          ri.quantity * COALESCE(NEW.unit_price, 0)
      END
    )
  WHERE ri.item_id = NEW.id
    AND ri.source_type = 'inventory';

  -- Recalculate total cost for all affected recipes
  UPDATE recipes r
  SET 
    total_cost = (
      SELECT COALESCE(SUM(ri.total_cost), 0)
      FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id
    ),
    cost_per_portion = (
      SELECT COALESCE(SUM(ri.total_cost), 0) / GREATEST(r.yield_quantity, 1)
      FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id
    ),
    cost_updated_at = NOW(),
    updated_at = NOW()
  WHERE r.id IN (
    SELECT DISTINCT recipe_id 
    FROM recipe_ingredients 
    WHERE item_id = NEW.id
  );

  RETURN NEW;
END;
$function$;
