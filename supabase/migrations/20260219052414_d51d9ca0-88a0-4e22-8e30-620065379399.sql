
-- Allow authenticated users to see all members of units they belong to
CREATE POLICY "Users can view members of their units"
ON public.user_units
FOR SELECT
USING (
  unit_id IN (
    SELECT uu.unit_id FROM public.user_units uu WHERE uu.user_id = auth.uid()
  )
);
