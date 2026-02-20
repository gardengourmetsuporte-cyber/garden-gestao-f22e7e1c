-- 1. Tighten tablet_orders SELECT: only recent orders (last 24h) visible publicly
-- This prevents dumping historical order data globally
DROP POLICY IF EXISTS "Public can view tablet_orders" ON public.tablet_orders;

CREATE POLICY "Public can view recent tablet_orders"
ON public.tablet_orders
FOR SELECT
USING (created_at > now() - interval '24 hours');

-- 2. Tighten tablet_order_items SELECT: only items for recent orders
DROP POLICY IF EXISTS "Public can view tablet_order_items" ON public.tablet_order_items;

CREATE POLICY "Public can view recent tablet_order_items"
ON public.tablet_order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tablet_orders
    WHERE tablet_orders.id = tablet_order_items.order_id
      AND tablet_orders.created_at > now() - interval '24 hours'
  )
);

-- 3. Tighten tablet_qr_confirmations SELECT: only unexpired/recent confirmations
DROP POLICY IF EXISTS "Public can view tablet_qr_confirmations" ON public.tablet_qr_confirmations;

CREATE POLICY "Public can view recent tablet_qr_confirmations"
ON public.tablet_qr_confirmations
FOR SELECT
USING (
  created_at > now() - interval '24 hours'
);

-- 4. Tighten tablet_order_items INSERT: only allow items for existing orders
DROP POLICY IF EXISTS "Public can insert tablet_order_items" ON public.tablet_order_items;

CREATE POLICY "Public can insert tablet_order_items for existing orders"
ON public.tablet_order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tablet_orders
    WHERE tablet_orders.id = tablet_order_items.order_id
      AND tablet_orders.created_at > now() - interval '1 hour'
      AND tablet_orders.status IN ('draft', 'awaiting_confirmation')
  )
);

-- 5. Tighten tablet_qr_confirmations INSERT: only for recent orders
DROP POLICY IF EXISTS "Public can insert tablet_qr_confirmations" ON public.tablet_qr_confirmations;

CREATE POLICY "Public can insert tablet_qr_confirmations for recent orders"
ON public.tablet_qr_confirmations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tablet_orders
    WHERE tablet_orders.id = tablet_qr_confirmations.order_id
      AND tablet_orders.created_at > now() - interval '1 hour'
  )
);