ALTER TABLE public.finance_transactions
ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;