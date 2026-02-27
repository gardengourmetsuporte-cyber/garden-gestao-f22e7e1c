
-- Table for custom checklist deadline settings per unit
CREATE TABLE public.checklist_deadline_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  checklist_type text NOT NULL,
  deadline_hour int NOT NULL DEFAULT 19,
  deadline_minute int NOT NULL DEFAULT 30,
  is_next_day boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, checklist_type)
);

-- RLS
ALTER TABLE public.checklist_deadline_settings ENABLE ROW LEVEL SECURITY;

-- Read: unit members
CREATE POLICY "Unit members can read deadline settings"
  ON public.checklist_deadline_settings FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Write: admins only
CREATE POLICY "Admins can manage deadline settings"
  ON public.checklist_deadline_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin') AND public.user_has_unit_access(auth.uid(), unit_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.user_has_unit_access(auth.uid(), unit_id));
