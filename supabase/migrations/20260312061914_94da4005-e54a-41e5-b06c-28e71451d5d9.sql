
-- Function: auto-consume inventory when a pos_sale becomes 'paid'
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
      SELECT ri.item_id, ri.quantity as recipe_qty, r.yield_quantity
      FROM recipe_ingredients ri
      JOIN recipes r ON r.id = ri.recipe_id
      WHERE r.product_id = item.product_id
        AND ri.source_type = 'inventory'
        AND ri.item_id IS NOT NULL
    LOOP
      UPDATE inventory_items
      SET current_stock = GREATEST(0,
        current_stock - (item.quantity::numeric / GREATEST(ingredient.yield_quantity, 1)) * ingredient.recipe_qty
      ), updated_at = now()
      WHERE id = ingredient.item_id AND unit_id = sale_unit_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_consume_stock
AFTER INSERT OR UPDATE ON pos_sales
FOR EACH ROW EXECUTE FUNCTION auto_consume_stock_on_sale();
