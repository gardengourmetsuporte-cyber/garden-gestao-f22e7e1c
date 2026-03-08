
-- Rodízio settings per unit
CREATE TABLE public.rodizio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  price numeric NOT NULL DEFAULT 0,
  time_limit_minutes integer NOT NULL DEFAULT 120,
  max_item_quantity integer NOT NULL DEFAULT 2,
  description text DEFAULT '',
  allowed_category_ids uuid[] DEFAULT '{}',
  allowed_group_ids uuid[] DEFAULT '{}',
  rules jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id)
);

-- Enable RLS
ALTER TABLE public.rodizio_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies: unit members can read, unit members can manage
CREATE POLICY "Unit members can view rodizio settings"
ON public.rodizio_settings FOR SELECT TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Unit members can insert rodizio settings"
ON public.rodizio_settings FOR INSERT TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Unit members can update rodizio settings"
ON public.rodizio_settings FOR UPDATE TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Public read for tablet access (unauthenticated users on tablet)
CREATE POLICY "Public can view active rodizio settings"
ON public.rodizio_settings FOR SELECT TO anon
USING (is_active = true);

-- Rodízio orders tracking
CREATE TABLE public.rodizio_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  table_number text NOT NULL DEFAULT '1',
  customer_name text DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'expired')),
  total_items_ordered integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rodizio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create rodizio sessions"
ON public.rodizio_sessions FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Public can view rodizio sessions"
ON public.rodizio_sessions FOR SELECT TO anon
USING (true);

CREATE POLICY "Public can update rodizio sessions"
ON public.rodizio_sessions FOR UPDATE TO anon
USING (true);

CREATE POLICY "Unit members can manage rodizio sessions"
ON public.rodizio_sessions FOR ALL TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));
