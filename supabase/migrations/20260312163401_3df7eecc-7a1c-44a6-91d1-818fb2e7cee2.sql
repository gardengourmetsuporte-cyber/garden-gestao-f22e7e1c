
CREATE TABLE public.manual_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  version TEXT NOT NULL DEFAULT '1.0',
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_info TEXT,
  UNIQUE(unit_id, employee_id, version)
);

ALTER TABLE public.manual_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view acknowledgments in their unit"
  ON public.manual_acknowledgments FOR SELECT
  TO authenticated
  USING (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())));

CREATE POLICY "Users can insert own acknowledgment"
  ON public.manual_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (unit_id IN (SELECT public.get_user_unit_ids(auth.uid())));
