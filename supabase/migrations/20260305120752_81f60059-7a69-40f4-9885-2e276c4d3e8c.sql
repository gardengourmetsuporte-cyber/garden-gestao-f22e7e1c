
-- Employee weekly schedule: per-day-of-week shift times
CREATE TABLE public.employee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  shift_start text NOT NULL DEFAULT '08:00',
  shift_end text NOT NULL DEFAULT '17:00',
  is_day_off boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, day_of_week)
);

-- RLS
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: users with unit access can read
CREATE POLICY "Users can read employee schedules for their unit"
  ON public.employee_schedules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_schedules.employee_id
        AND public.user_has_unit_access(auth.uid(), e.unit_id)
    )
  );

-- Policy: admins can manage
CREATE POLICY "Admins can manage employee schedules"
  ON public.employee_schedules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.user_units uu ON uu.unit_id = e.unit_id AND uu.user_id = auth.uid()
      WHERE e.id = employee_schedules.employee_id
        AND uu.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.user_units uu ON uu.unit_id = e.unit_id AND uu.user_id = auth.uid()
      WHERE e.id = employee_schedules.employee_id
        AND uu.role IN ('owner', 'admin')
    )
  );
