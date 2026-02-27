
-- Add payment_code to tablet_pdv_config
ALTER TABLE public.tablet_pdv_config ADD COLUMN IF NOT EXISTS payment_code text DEFAULT '1';

-- Add retry_count to tablet_orders
ALTER TABLE public.tablet_orders ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
