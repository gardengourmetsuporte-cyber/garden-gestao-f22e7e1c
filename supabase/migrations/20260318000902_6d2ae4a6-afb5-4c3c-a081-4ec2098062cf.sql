
-- Trigger function: notify PDV/deliveries users when a delivery goes "out"
CREATE OR REPLACE FUNCTION public.notify_delivery_dispatched()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_record RECORD;
  order_num TEXT;
BEGIN
  IF NEW.status = 'out' AND (OLD.status IS DISTINCT FROM 'out') THEN
    order_num := COALESCE(NEW.order_number, LEFT(NEW.id::text, 8));

    -- Find all users in this unit whose access_level includes 'pdv' or 'deliveries'
    FOR user_record IN
      SELECT DISTINCT uu.user_id
      FROM public.user_units uu
      JOIN public.access_levels al ON al.id = uu.access_level_id
      WHERE uu.unit_id = NEW.unit_id
        AND (al.modules @> ARRAY['menu-admin.pdv'] OR al.modules @> ARRAY['deliveries'])
        AND uu.user_id IS DISTINCT FROM NEW.assigned_to
      UNION
      -- Also include unit owners (no access_level restriction)
      SELECT uu.user_id
      FROM public.user_units uu
      WHERE uu.unit_id = NEW.unit_id
        AND uu.role = 'owner'
        AND uu.user_id IS DISTINCT FROM NEW.assigned_to
    LOOP
      INSERT INTO public.notifications (user_id, type, title, description, origin)
      VALUES (
        user_record.user_id,
        'info',
        '🚀 Entrega saiu!',
        'Pedido #' || order_num || ' saiu para entrega',
        'entregas'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on deliveries table
DROP TRIGGER IF EXISTS on_delivery_dispatched ON public.deliveries;
CREATE TRIGGER on_delivery_dispatched
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_delivery_dispatched();
