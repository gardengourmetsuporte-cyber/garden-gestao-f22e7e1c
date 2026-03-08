
-- POS Sales table
CREATE TABLE public.pos_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sale_number SERIAL,
  source TEXT NOT NULL DEFAULT 'balcao', -- balcao, mesa, delivery
  source_order_id UUID, -- references tablet_orders or delivery_hub_orders
  customer_name TEXT,
  customer_phone TEXT,
  customer_document TEXT, -- CPF for NFC-e
  table_number INT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open', -- open, paid, cancelled
  notes TEXT,
  fiscal_status TEXT DEFAULT 'pending', -- pending, issued, error, exempt
  fiscal_key TEXT, -- chave de acesso NFC-e
  fiscal_xml TEXT, -- XML da NFC-e
  fiscal_number TEXT, -- número da NFC-e
  fiscal_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- POS Sale Items
CREATE TABLE public.pos_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID, -- references tablet_products
  product_name TEXT NOT NULL,
  product_code TEXT, -- codigo_pdv
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS Sale Payments (multiple payment methods per sale)
CREATE TABLE public.pos_sale_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  method TEXT NOT NULL, -- cash, debit, credit, pix, meal_voucher
  amount NUMERIC NOT NULL DEFAULT 0,
  change_amount NUMERIC NOT NULL DEFAULT 0, -- troco
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage pos_sales in their units"
  ON public.pos_sales FOR ALL TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id))
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can manage pos_sale_items via sale"
  ON public.pos_sale_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pos_sales s WHERE s.id = sale_id AND public.user_has_unit_access(auth.uid(), s.unit_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pos_sales s WHERE s.id = sale_id AND public.user_has_unit_access(auth.uid(), s.unit_id)));

CREATE POLICY "Users can manage pos_sale_payments via sale"
  ON public.pos_sale_payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pos_sales s WHERE s.id = sale_id AND public.user_has_unit_access(auth.uid(), s.unit_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pos_sales s WHERE s.id = sale_id AND public.user_has_unit_access(auth.uid(), s.unit_id)));

-- Index for performance
CREATE INDEX idx_pos_sales_unit_id ON public.pos_sales(unit_id);
CREATE INDEX idx_pos_sales_status ON public.pos_sales(status);
CREATE INDEX idx_pos_sale_items_sale_id ON public.pos_sale_items(sale_id);
CREATE INDEX idx_pos_sale_payments_sale_id ON public.pos_sale_payments(sale_id);
