
-- Quotation status enum
CREATE TYPE public.quotation_status AS ENUM ('draft', 'sent', 'comparing', 'contested', 'resolved');
CREATE TYPE public.quotation_supplier_status AS ENUM ('pending', 'responded', 'contested');

-- Main quotation table
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  status quotation_status NOT NULL DEFAULT 'draft',
  deadline timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Suppliers invited to a quotation (each gets a unique public token)
CREATE TABLE public.quotation_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status quotation_supplier_status NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Items being quoted
CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  winner_supplier_id uuid REFERENCES public.suppliers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prices submitted by suppliers
CREATE TABLE public.quotation_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_item_id uuid NOT NULL REFERENCES public.quotation_items(id) ON DELETE CASCADE,
  quotation_supplier_id uuid NOT NULL REFERENCES public.quotation_suppliers(id) ON DELETE CASCADE,
  unit_price numeric NOT NULL DEFAULT 0,
  brand text,
  notes text,
  round int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_prices ENABLE ROW LEVEL SECURITY;

-- RLS: quotations - admin access via unit
CREATE POLICY "quotations_admin_all" ON public.quotations
  FOR ALL TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id))
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

-- RLS: quotation_items - admin access via quotation's unit
CREATE POLICY "quotation_items_admin_all" ON public.quotation_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND public.user_has_unit_access(auth.uid(), q.unit_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND public.user_has_unit_access(auth.uid(), q.unit_id))
  );

-- RLS: quotation_suppliers - admin access via quotation's unit
CREATE POLICY "quotation_suppliers_admin_all" ON public.quotation_suppliers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND public.user_has_unit_access(auth.uid(), q.unit_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotations q WHERE q.id = quotation_id AND public.user_has_unit_access(auth.uid(), q.unit_id))
  );

-- RLS: quotation_suppliers - anon can SELECT by token (for public page)
CREATE POLICY "quotation_suppliers_public_select" ON public.quotation_suppliers
  FOR SELECT TO anon
  USING (true);

-- RLS: quotation_items - anon can SELECT via quotation_suppliers token
CREATE POLICY "quotation_items_public_select" ON public.quotation_items
  FOR SELECT TO anon
  USING (true);

-- RLS: quotation_prices - admin access
CREATE POLICY "quotation_prices_admin_all" ON public.quotation_prices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotation_suppliers qs
      JOIN public.quotations q ON q.id = qs.quotation_id
      WHERE qs.id = quotation_supplier_id AND public.user_has_unit_access(auth.uid(), q.unit_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotation_suppliers qs
      JOIN public.quotations q ON q.id = qs.quotation_id
      WHERE qs.id = quotation_supplier_id AND public.user_has_unit_access(auth.uid(), q.unit_id)
    )
  );

-- RLS: quotation_prices - anon can SELECT and INSERT (for supplier public form)
CREATE POLICY "quotation_prices_public_select" ON public.quotation_prices
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "quotation_prices_public_insert" ON public.quotation_prices
  FOR INSERT TO anon
  WITH CHECK (true);

-- Enable realtime for quotation_prices so admin sees updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotation_suppliers;

-- Updated_at trigger for quotations
CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
