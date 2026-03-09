
-- Auto-accept trigger: new tablet_orders get status 'preparing' automatically
CREATE OR REPLACE FUNCTION public.auto_accept_tablet_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-set status to 'preparing' for new orders
  IF NEW.status IN ('pending', 'awaiting_confirmation', 'new') THEN
    NEW.status := 'preparing';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_accept_tablet_order
  BEFORE INSERT ON public.tablet_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_accept_tablet_order();
