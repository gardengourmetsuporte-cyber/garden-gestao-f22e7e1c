
-- Delivery zones table for fee calculation per unit
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  min_distance_km NUMERIC NOT NULL DEFAULT 0,
  max_distance_km NUMERIC NOT NULL DEFAULT 5,
  fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view zones of their units"
  ON public.delivery_zones FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can manage zones of their units"
  ON public.delivery_zones FOR ALL
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id))
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

-- Also allow public SELECT for delivery fee calculation (customer facing)
CREATE POLICY "Public can read active zones"
  ON public.delivery_zones FOR SELECT
  TO anon
  USING (is_active = true);

-- Add store_address to units.store_info (no schema change needed, it's JSON)
-- We'll store the origin address in store_info.address field
