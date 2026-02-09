
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'alert', 'success')),
  title text NOT NULL,
  description text NOT NULL,
  origin text NOT NULL DEFAULT 'sistema' CHECK (origin IN ('estoque', 'financeiro', 'checklist', 'sistema')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: admins see all, users see own
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all notifications"
  ON public.notifications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all notifications"
  ON public.notifications FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: create notification for ALL admins when stock hits zero
CREATE OR REPLACE FUNCTION public.notify_stock_zero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  item_name text;
BEGIN
  -- Only trigger when stock reaches 0 or goes below min_stock
  IF NEW.current_stock <= NEW.min_stock AND (OLD.current_stock > NEW.min_stock OR OLD.current_stock > 0) THEN
    SELECT name INTO item_name FROM public.inventory_items WHERE id = NEW.id;
    
    IF NEW.current_stock = 0 THEN
      -- Notify all admins about zero stock
      FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, type, title, description, origin)
        VALUES (
          admin_record.user_id,
          'alert',
          'Estoque zerado',
          'O item "' || item_name || '" ficou com estoque zerado.',
          'estoque'
        );
      END LOOP;
    ELSE
      -- Notify all admins about low stock
      FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, type, title, description, origin)
        VALUES (
          admin_record.user_id,
          'alert',
          'Estoque baixo',
          'O item "' || item_name || '" está abaixo do mínimo (' || NEW.current_stock || '/' || NEW.min_stock || ').',
          'estoque'
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_stock_zero
  AFTER UPDATE OF current_stock ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_stock_zero();
