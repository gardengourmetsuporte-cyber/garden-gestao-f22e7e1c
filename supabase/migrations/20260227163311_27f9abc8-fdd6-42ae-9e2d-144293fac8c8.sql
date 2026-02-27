
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  origin text NOT NULL DEFAULT 'manual',
  notes text,
  total_spent numeric DEFAULT 0,
  total_orders integer DEFAULT 0,
  last_purchase_at timestamptz,
  birthday date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers of their unit"
  ON public.customers FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update customers"
  ON public.customers FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete customers"
  ON public.customers FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_customers_unit_id ON public.customers(unit_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
