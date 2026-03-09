
-- Customer saved addresses table
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Casa',
  street text NOT NULL DEFAULT '',
  number text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  complement text DEFAULT NULL,
  reference text DEFAULT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customers can manage their own addresses (matched by email)
CREATE POLICY "Customers can view own addresses"
ON public.customer_addresses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Customers can insert own addresses"
ON public.customer_addresses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Customers can update own addresses"
ON public.customer_addresses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Customers can delete own addresses"
ON public.customer_addresses FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = customer_addresses.customer_id
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Unit members can view addresses for their unit
CREATE POLICY "Unit members can view addresses"
ON public.customer_addresses FOR SELECT
USING (public.user_has_unit_access(auth.uid(), unit_id));
