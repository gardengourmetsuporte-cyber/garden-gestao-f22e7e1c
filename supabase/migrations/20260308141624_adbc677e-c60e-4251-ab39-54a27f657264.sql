
-- Allow public (KDS) to update tablet_orders status for active orders
DROP POLICY IF EXISTS "Public can update draft tablet_orders" ON public.tablet_orders;

CREATE POLICY "Public can update tablet_orders status"
ON public.tablet_orders
FOR UPDATE
TO public
USING (created_at > (now() - interval '24 hours'))
WITH CHECK (status IN ('draft', 'pending_qr', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'));
