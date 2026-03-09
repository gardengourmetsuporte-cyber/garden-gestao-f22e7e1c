
-- Fix: allow inserting items for orders with 'preparing' status (set by auto-accept trigger)
DROP POLICY IF EXISTS "Public can insert tablet_order_items for existing orders" ON public.tablet_order_items;

CREATE POLICY "Public can insert tablet_order_items for existing orders"
ON public.tablet_order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tablet_orders
    WHERE tablet_orders.id = tablet_order_items.order_id
      AND tablet_orders.created_at > now() - interval '1 hour'
      AND tablet_orders.status IN ('draft', 'awaiting_confirmation', 'preparing')
  )
);
