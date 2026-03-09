
-- Table bills: aggregates orders for a table into a single bill
CREATE TABLE public.table_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting_payment', 'paid', 'cancelled')),
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow anon + authenticated to manage bills from tablet
ALTER TABLE public.table_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read table_bills" ON public.table_bills FOR SELECT USING (true);
CREATE POLICY "Anyone can insert table_bills" ON public.table_bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update table_bills" ON public.table_bills FOR UPDATE USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.table_bills TO anon, authenticated;
