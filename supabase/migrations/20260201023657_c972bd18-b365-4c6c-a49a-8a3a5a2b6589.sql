-- Update policy to allow deletion of received orders too
DROP POLICY IF EXISTS "Users can delete own draft or sent orders" ON public.orders;

CREATE POLICY "Users can delete own orders"
ON public.orders
FOR DELETE
USING (
  is_authenticated() AND 
  (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)) AND
  status IN ('draft', 'sent', 'received')
);