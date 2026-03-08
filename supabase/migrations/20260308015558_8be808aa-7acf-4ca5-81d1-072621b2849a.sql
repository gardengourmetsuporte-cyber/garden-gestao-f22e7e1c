
-- Add source and customer_info columns to tablet_orders
ALTER TABLE public.tablet_orders 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'mesa',
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_address text;
