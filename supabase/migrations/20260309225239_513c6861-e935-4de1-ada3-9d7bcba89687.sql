
-- 1. Create kds_stations table
CREATE TABLE public.kds_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  icon text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add kds_station_id to recipe_ingredients
ALTER TABLE public.recipe_ingredients
ADD COLUMN kds_station_id uuid REFERENCES public.kds_stations(id) ON DELETE SET NULL DEFAULT NULL;

-- 3. Enable RLS
ALTER TABLE public.kds_stations ENABLE ROW LEVEL SECURITY;

-- 4. Public read (KDS is public, no auth required)
CREATE POLICY "Anyone can read kds_stations"
ON public.kds_stations FOR SELECT
USING (true);

-- 5. Authenticated users with unit access can manage
CREATE POLICY "Unit members can insert kds_stations"
ON public.kds_stations FOR INSERT
TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Unit members can update kds_stations"
ON public.kds_stations FOR UPDATE
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Unit members can delete kds_stations"
ON public.kds_stations FOR DELETE
TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));
