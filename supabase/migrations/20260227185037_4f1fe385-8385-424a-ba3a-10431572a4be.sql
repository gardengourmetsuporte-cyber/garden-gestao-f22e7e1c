
-- Allow public SELECT on gamification_plays filtered by unit_id + order_id (for checkAlreadyPlayed)
DROP POLICY IF EXISTS "Admins can view gamification plays" ON gamification_plays;

-- Admins still get full access
CREATE POLICY "Admins can view gamification plays"
ON gamification_plays FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can check if an order already played (needed for digital menu)
CREATE POLICY "Public can check order plays"
ON gamification_plays FOR SELECT
USING (true);
