-- Restrict public UPDATE on tablet_orders to only draft orders
-- This prevents manipulation of confirmed/sent orders while allowing
-- the normal tablet ordering flow (updating totals on draft orders)
DROP POLICY IF EXISTS "Public can update tablet_orders" ON public.tablet_orders;

CREATE POLICY "Public can update draft tablet_orders"
ON public.tablet_orders
FOR UPDATE
USING (status = 'draft')
WITH CHECK (status IN ('draft', 'pending_qr'));

-- Similarly restrict public UPDATE on tablet_qr_confirmations
-- Only allow updates on unused tokens (the edge function uses service role anyway)
DROP POLICY IF EXISTS "Public can update tablet_qr_confirmations" ON public.tablet_qr_confirmations;

CREATE POLICY "Public can update unused tablet_qr_confirmations"
ON public.tablet_qr_confirmations
FOR UPDATE
USING (used = false)
WITH CHECK (used = false);