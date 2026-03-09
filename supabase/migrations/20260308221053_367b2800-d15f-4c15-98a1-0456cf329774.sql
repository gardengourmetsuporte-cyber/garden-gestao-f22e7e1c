
-- Add portal_token to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS portal_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Backfill existing suppliers
UPDATE public.suppliers SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.suppliers ALTER COLUMN portal_token SET NOT NULL;

-- Enable realtime for supplier_invoices
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_invoices;
