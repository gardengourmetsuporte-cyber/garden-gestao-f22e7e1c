-- Create a secure function to update stock after movement is inserted
-- This runs with SECURITY DEFINER privileges to bypass RLS

CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the inventory item's current_stock based on movement type
  IF NEW.type = 'entrada' THEN
    UPDATE public.inventory_items
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'saida' THEN
    UPDATE public.inventory_items
    SET current_stock = GREATEST(0, current_stock - NEW.quantity),
        updated_at = now()
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update stock when a movement is inserted
DROP TRIGGER IF EXISTS trigger_update_stock_on_movement ON public.stock_movements;
CREATE TRIGGER trigger_update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_movement();