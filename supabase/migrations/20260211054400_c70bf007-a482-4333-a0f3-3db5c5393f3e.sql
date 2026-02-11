
-- Tablet Products (cardápio do tablet)
CREATE TABLE public.tablet_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  codigo_pdv TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Geral',
  image_url TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tablet_products ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admins can manage tablet_products"
  ON public.tablet_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public read for active products (tablet clients, no auth)
CREATE POLICY "Public can view active tablet_products"
  ON public.tablet_products FOR SELECT
  USING (is_active = true);

-- Tablet Tables (mesas)
CREATE TABLE public.tablet_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id, number)
);

ALTER TABLE public.tablet_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tablet_tables"
  ON public.tablet_tables FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view tablet_tables"
  ON public.tablet_tables FOR SELECT
  USING (true);

-- Tablet Orders
CREATE TABLE public.tablet_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total NUMERIC NOT NULL DEFAULT 0,
  pdv_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tablet_orders ENABLE ROW LEVEL SECURITY;

-- Public can create and view orders (tablet clients)
CREATE POLICY "Public can insert tablet_orders"
  ON public.tablet_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view tablet_orders"
  ON public.tablet_orders FOR SELECT
  USING (true);

CREATE POLICY "Public can update tablet_orders"
  ON public.tablet_orders FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage tablet_orders"
  ON public.tablet_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tablet Order Items
CREATE TABLE public.tablet_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.tablet_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.tablet_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tablet_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert tablet_order_items"
  ON public.tablet_order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view tablet_order_items"
  ON public.tablet_order_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tablet_order_items"
  ON public.tablet_order_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- QR Confirmations
CREATE TABLE public.tablet_qr_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.tablet_orders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tablet_qr_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert tablet_qr_confirmations"
  ON public.tablet_qr_confirmations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view tablet_qr_confirmations"
  ON public.tablet_qr_confirmations FOR SELECT
  USING (true);

CREATE POLICY "Public can update tablet_qr_confirmations"
  ON public.tablet_qr_confirmations FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage tablet_qr_confirmations"
  ON public.tablet_qr_confirmations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PDV Config (per unit)
CREATE TABLE public.tablet_pdv_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL UNIQUE REFERENCES public.units(id) ON DELETE CASCADE,
  hub_url TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tablet_pdv_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tablet_pdv_config"
  ON public.tablet_pdv_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_tablet_products_updated_at BEFORE UPDATE ON public.tablet_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tablet_tables_updated_at BEFORE UPDATE ON public.tablet_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tablet_orders_updated_at BEFORE UPDATE ON public.tablet_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tablet_pdv_config_updated_at BEFORE UPDATE ON public.tablet_pdv_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders (monitor)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tablet_orders;
