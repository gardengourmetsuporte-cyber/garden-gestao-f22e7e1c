
-- Fix: orders from mesa/balcao should go to 'confirmed' instead of 'preparing'
-- Kitchen staff will manually move them to 'preparing' when they start cooking
CREATE OR REPLACE FUNCTION public.auto_accept_tablet_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mesa/balcao orders auto-confirm but wait for kitchen to start preparing
  IF NEW.source IN ('mesa', 'balcao') AND NEW.status IN ('pending', 'awaiting_confirmation', 'new') THEN
    NEW.status := 'confirmed';
  END IF;
  RETURN NEW;
END;
$$;
