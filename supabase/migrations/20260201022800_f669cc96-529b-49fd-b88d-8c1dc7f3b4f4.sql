-- Allow authenticated users to delete their own orders (draft/sent only)
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Users can delete own draft or sent orders"
ON public.orders
FOR DELETE
USING (
  is_authenticated() AND 
  (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)) AND
  status IN ('draft', 'sent')
);

-- Also allow deletion of order_items when order is deleted
DROP POLICY IF EXISTS "Admins can delete order_items" ON public.order_items;

CREATE POLICY "Users can delete order_items of own orders"
ON public.order_items
FOR DELETE
USING (
  is_authenticated() AND
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);