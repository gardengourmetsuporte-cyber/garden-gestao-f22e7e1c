
-- Fix auto_consume_stock_on_sale: use tablet_products.recipe_id instead of recipes.product_id
CREATE OR REPLACE FUNCTION public.auto_consume_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item RECORD;
  ingredient RECORD;
  sale_unit_id uuid;
BEGIN
  IF NEW.status != 'paid' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'paid' THEN RETURN NEW; END IF;

  sale_unit_id := NEW.unit_id;

  FOR item IN
    SELECT si.product_id, si.quantity
    FROM pos_sale_items si
    WHERE si.sale_id = NEW.id AND si.product_id IS NOT NULL
  LOOP
    FOR ingredient IN
      SELECT ri.item_id, ri.quantity as recipe_qty,
             ri.unit_type as recipe_unit, r.yield_quantity,
             inv.unit_type as inv_unit
      FROM tablet_products tp
      JOIN recipes r ON r.id = tp.recipe_id
      JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      JOIN inventory_items inv ON inv.id = ri.item_id
      WHERE tp.id = item.product_id
        AND ri.source_type = 'inventory'
        AND ri.item_id IS NOT NULL
    LOOP
      UPDATE inventory_items
      SET current_stock = GREATEST(0,
        current_stock - (item.quantity::numeric / GREATEST(ingredient.yield_quantity, 1))
        * CASE
            WHEN ingredient.recipe_unit = ingredient.inv_unit THEN ingredient.recipe_qty
            WHEN ingredient.recipe_unit = 'g' AND ingredient.inv_unit = 'kg' THEN ingredient.recipe_qty / 1000
            WHEN ingredient.recipe_unit = 'kg' AND ingredient.inv_unit = 'g' THEN ingredient.recipe_qty * 1000
            WHEN ingredient.recipe_unit = 'ml' AND ingredient.inv_unit = 'litro' THEN ingredient.recipe_qty / 1000
            WHEN ingredient.recipe_unit = 'litro' AND ingredient.inv_unit = 'ml' THEN ingredient.recipe_qty * 1000
            ELSE ingredient.recipe_qty
          END
      ), updated_at = now()
      WHERE id = ingredient.item_id AND unit_id = sale_unit_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Auto-consume stock on tablet/delivery orders when completed/delivered
CREATE OR REPLACE FUNCTION public.auto_consume_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_item RECORD;
  ingredient RECORD;
  order_unit_id uuid;
BEGIN
  -- Only trigger when status changes to delivered or completed
  IF NEW.status NOT IN ('delivered', 'completed') THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status IN ('delivered', 'completed') THEN RETURN NEW; END IF;

  order_unit_id := NEW.unit_id;

  FOR order_item IN
    SELECT toi.product_id, toi.quantity
    FROM tablet_order_items toi
    WHERE toi.order_id = NEW.id AND toi.product_id IS NOT NULL
  LOOP
    FOR ingredient IN
      SELECT ri.item_id, ri.quantity as recipe_qty,
             ri.unit_type as recipe_unit, r.yield_quantity,
             inv.unit_type as inv_unit
      FROM tablet_products tp
      JOIN recipes r ON r.id = tp.recipe_id
      JOIN recipe_ingredients ri ON ri.recipe_id = r.id
      JOIN inventory_items inv ON inv.id = ri.item_id
      WHERE tp.id = order_item.product_id
        AND ri.source_type = 'inventory'
        AND ri.item_id IS NOT NULL
    LOOP
      UPDATE inventory_items
      SET current_stock = GREATEST(0,
        current_stock - (order_item.quantity::numeric / GREATEST(ingredient.yield_quantity, 1))
        * CASE
            WHEN ingredient.recipe_unit = ingredient.inv_unit THEN ingredient.recipe_qty
            WHEN ingredient.recipe_unit = 'g' AND ingredient.inv_unit = 'kg' THEN ingredient.recipe_qty / 1000
            WHEN ingredient.recipe_unit = 'kg' AND ingredient.inv_unit = 'g' THEN ingredient.recipe_qty * 1000
            WHEN ingredient.recipe_unit = 'ml' AND ingredient.inv_unit = 'litro' THEN ingredient.recipe_qty / 1000
            WHEN ingredient.recipe_unit = 'litro' AND ingredient.inv_unit = 'ml' THEN ingredient.recipe_qty * 1000
            ELSE ingredient.recipe_qty
          END
      ), updated_at = now()
      WHERE id = ingredient.item_id AND unit_id = order_unit_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for tablet_orders (drop if exists first)
DROP TRIGGER IF EXISTS trg_auto_consume_stock_on_order ON tablet_orders;
CREATE TRIGGER trg_auto_consume_stock_on_order
AFTER UPDATE ON tablet_orders
FOR EACH ROW EXECUTE FUNCTION auto_consume_stock_on_order();
