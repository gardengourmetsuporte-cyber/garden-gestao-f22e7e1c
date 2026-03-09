
ALTER TABLE public.tablet_orders 
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_change numeric DEFAULT 0;
