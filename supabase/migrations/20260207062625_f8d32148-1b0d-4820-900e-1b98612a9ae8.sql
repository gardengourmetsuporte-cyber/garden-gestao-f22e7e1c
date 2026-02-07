-- Create employees table (can be linked to users or standalone)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cpf TEXT,
  role TEXT,
  department TEXT,
  admission_date DATE,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create employee_payments table for salary and vale records
CREATE TABLE public.employee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('salary', 'vale', 'bonus', 'discount', 'other')),
  reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  receipt_url TEXT,
  notes TEXT,
  finance_transaction_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;

-- Employees policies
CREATE POLICY "Admins can manage employees"
ON public.employees FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own employee record"
ON public.employees FOR SELECT
USING (user_id = auth.uid());

-- Employee payments policies
CREATE POLICY "Admins can manage payments"
ON public.employee_payments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own payments"
ON public.employee_payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_payments.employee_id
    AND e.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employee_payments_employee_id ON public.employee_payments(employee_id);
CREATE INDEX idx_employee_payments_reference ON public.employee_payments(reference_year, reference_month);

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_payments_updated_at
  BEFORE UPDATE ON public.employee_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();