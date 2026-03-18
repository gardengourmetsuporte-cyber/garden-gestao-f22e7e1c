
-- Create freelancers table
CREATE TABLE public.freelancers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  sector text NOT NULL DEFAULT 'outros',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.freelancers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view freelancers in their units"
  ON public.freelancers FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert freelancers in their units"
  ON public.freelancers FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update freelancers in their units"
  ON public.freelancers FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete freelancers in their units"
  ON public.freelancers FOR DELETE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Index
CREATE INDEX idx_freelancers_unit_id ON public.freelancers(unit_id);
