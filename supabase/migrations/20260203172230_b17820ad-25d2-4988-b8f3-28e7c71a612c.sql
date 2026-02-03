-- Create trigger to reverse stock when movement is deleted
CREATE OR REPLACE FUNCTION public.reverse_stock_on_movement_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reverse the stock change based on movement type
  IF OLD.type = 'entrada' THEN
    -- If it was an entry, subtract the quantity
    UPDATE public.inventory_items
    SET current_stock = GREATEST(0, current_stock - OLD.quantity),
        updated_at = now()
    WHERE id = OLD.item_id;
  ELSIF OLD.type = 'saida' THEN
    -- If it was an exit, add the quantity back
    UPDATE public.inventory_items
    SET current_stock = current_stock + OLD.quantity,
        updated_at = now()
    WHERE id = OLD.item_id;
  END IF;
  
  RETURN OLD;
END;
$function$;

-- Create trigger for delete
CREATE TRIGGER reverse_stock_on_delete
BEFORE DELETE ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.reverse_stock_on_movement_delete();