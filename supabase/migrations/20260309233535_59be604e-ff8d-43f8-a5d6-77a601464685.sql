
CREATE POLICY "Public can view customer ranking"
ON public.customers
FOR SELECT
USING (
  loyalty_points > 0 AND deleted_at IS NULL
);
