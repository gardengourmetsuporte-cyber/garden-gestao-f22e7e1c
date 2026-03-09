
-- Add sequential order_number to tablet_orders
-- Use a sequence per unit_id for daily-reset-free sequential numbering
ALTER TABLE public.tablet_orders ADD COLUMN IF NOT EXISTS order_number integer;

-- Create a function to auto-generate sequential order numbers per unit
CREATE OR REPLACE FUNCTION public.generate_tablet_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num
  FROM public.tablet_orders
  WHERE unit_id = NEW.unit_id;
  
  NEW.order_number := next_num;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_tablet_order_number ON public.tablet_orders;
CREATE TRIGGER trg_tablet_order_number
  BEFORE INSERT ON public.tablet_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_tablet_order_number();

-- Backfill existing orders
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY created_at) AS rn
  FROM public.tablet_orders
  WHERE order_number IS NULL
)
UPDATE public.tablet_orders t
SET order_number = n.rn
FROM numbered n
WHERE t.id = n.id;
