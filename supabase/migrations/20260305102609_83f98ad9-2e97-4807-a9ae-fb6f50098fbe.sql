
-- Create enums for warning types
CREATE TYPE public.warning_type AS ENUM ('verbal', 'written', 'suspension', 'dismissal');
CREATE TYPE public.warning_severity AS ENUM ('light', 'moderate', 'serious');

-- Create employee_warnings table
CREATE TABLE public.employee_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type warning_type NOT NULL DEFAULT 'verbal',
  severity warning_severity NOT NULL DEFAULT 'light',
  reason TEXT NOT NULL,
  legal_basis TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  suspension_days INTEGER DEFAULT 0,
  witness_1 TEXT,
  witness_2 TEXT,
  document_url TEXT,
  employee_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  issued_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_warnings ENABLE ROW LEVEL SECURITY;

-- Admin policy: full CRUD for unit members with admin role
CREATE POLICY "Admins can manage warnings"
  ON public.employee_warnings
  FOR ALL
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id))
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

-- Employee policy: can view own warnings (via linked employee record)
CREATE POLICY "Employees can view own warnings"
  ON public.employee_warnings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id AND e.user_id = auth.uid()
    )
  );

-- Employee can update acknowledged fields on own warnings
CREATE POLICY "Employees can acknowledge own warnings"
  ON public.employee_warnings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = employee_id AND e.user_id = auth.uid()
    )
  );
