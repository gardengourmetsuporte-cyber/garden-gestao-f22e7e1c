
ALTER TABLE public.tablet_orders ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
