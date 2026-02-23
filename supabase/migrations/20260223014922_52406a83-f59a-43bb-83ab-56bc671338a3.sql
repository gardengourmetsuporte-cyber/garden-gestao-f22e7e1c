
-- Allow authenticated users to create their own units (for onboarding)
CREATE POLICY "Authenticated users can create units"
ON public.units
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);
