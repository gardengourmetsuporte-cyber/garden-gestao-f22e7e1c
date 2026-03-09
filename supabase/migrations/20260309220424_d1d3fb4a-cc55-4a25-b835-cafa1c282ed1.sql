
DROP POLICY "Public can insert tablet_order_items for existing orders" ON public.tablet_order_items;

CREATE POLICY "Public can insert tablet_order_items for existing orders"
ON public.tablet_order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tablet_orders
    WHERE tablet_orders.id = tablet_order_items.order_id
      AND tablet_orders.created_at > (now() - interval '1 hour')
      AND tablet_orders.status IN ('draft', 'awaiting_confirmation', 'confirmed', 'preparing')
  )
);
