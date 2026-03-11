
ALTER TABLE public.tablet_orders ADD COLUMN IF NOT EXISTS comanda_number integer;
CREATE INDEX IF NOT EXISTS idx_tablet_orders_comanda_number ON public.tablet_orders (unit_id, comanda_number) WHERE comanda_number IS NOT NULL;
