
-- Add store_info jsonb column to units for digital menu landing
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS store_info jsonb DEFAULT '{}';

-- Allow public (anon) to view basic unit info for the digital menu
CREATE POLICY "Public can view units for digital menu"
  ON public.units FOR SELECT
  TO anon
  USING (is_active = true);
