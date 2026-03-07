
-- Delivery Hub: External platform orders (iFood, Rappi, etc.)
CREATE TYPE public.delivery_hub_platform AS ENUM ('ifood', 'rappi', 'uber_eats', 'aiqfome', 'manual');
CREATE TYPE public.delivery_hub_order_status AS ENUM ('new', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled');

CREATE TABLE public.delivery_hub_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  platform delivery_hub_platform NOT NULL DEFAULT 'manual',
  platform_order_id text,
  platform_display_id text,
  status delivery_hub_order_status NOT NULL DEFAULT 'new',
  customer_name text NOT NULL DEFAULT '',
  customer_phone text,
  customer_address text,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text,
  notes text,
  platform_data jsonb DEFAULT '{}',
  received_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_hub_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.delivery_hub_orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  notes text,
  options jsonb DEFAULT '[]'
);

-- Indexes
CREATE INDEX idx_dhub_orders_unit ON public.delivery_hub_orders(unit_id);
CREATE INDEX idx_dhub_orders_status ON public.delivery_hub_orders(status);
CREATE INDEX idx_dhub_orders_received ON public.delivery_hub_orders(received_at DESC);
CREATE INDEX idx_dhub_items_order ON public.delivery_hub_order_items(order_id);

-- RLS
ALTER TABLE public.delivery_hub_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_hub_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hub orders of their units"
  ON public.delivery_hub_orders FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update hub orders of their units"
  ON public.delivery_hub_orders FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Service can insert hub orders"
  ON public.delivery_hub_orders FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view hub order items of their units"
  ON public.delivery_hub_order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.delivery_hub_orders o
    WHERE o.id = order_id AND public.user_has_unit_access(auth.uid(), o.unit_id)
  ));

CREATE POLICY "Service can insert hub order items"
  ON public.delivery_hub_order_items FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_hub_orders;
