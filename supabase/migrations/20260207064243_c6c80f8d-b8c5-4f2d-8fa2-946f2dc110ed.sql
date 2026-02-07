-- 1. Add supplier_id to finance_transactions
ALTER TABLE public.finance_transactions
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Create index for supplier_id
CREATE INDEX idx_finance_transactions_supplier_id ON public.finance_transactions(supplier_id);

-- 2. Create supplier_invoices table for bills/boletos
CREATE TABLE public.supplier_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  invoice_number text,
  description text NOT NULL,
  amount numeric NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  finance_transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_invoices (admin only)
CREATE POLICY "Admins can manage supplier invoices"
  ON public.supplier_invoices
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Indexes for supplier_invoices
CREATE INDEX idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_due_date ON public.supplier_invoices(due_date);
CREATE INDEX idx_supplier_invoices_is_paid ON public.supplier_invoices(is_paid);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Expand employee_payments with detailed payslip structure
-- Add new columns to employee_payments for detailed breakdown
ALTER TABLE public.employee_payments
ADD COLUMN base_salary numeric DEFAULT 0,
ADD COLUMN regular_hours numeric DEFAULT 0,
ADD COLUMN night_hours numeric DEFAULT 0,
ADD COLUMN night_bonus numeric DEFAULT 0,
ADD COLUMN overtime_hours numeric DEFAULT 0,
ADD COLUMN overtime_bonus numeric DEFAULT 0,
ADD COLUMN meal_allowance numeric DEFAULT 0,
ADD COLUMN transport_allowance numeric DEFAULT 0,
ADD COLUMN other_earnings numeric DEFAULT 0,
ADD COLUMN other_earnings_description text,
ADD COLUMN inss_deduction numeric DEFAULT 0,
ADD COLUMN irrf_deduction numeric DEFAULT 0,
ADD COLUMN advance_deduction numeric DEFAULT 0,
ADD COLUMN other_deductions numeric DEFAULT 0,
ADD COLUMN other_deductions_description text,
ADD COLUMN total_earnings numeric DEFAULT 0,
ADD COLUMN total_deductions numeric DEFAULT 0,
ADD COLUMN net_salary numeric DEFAULT 0,
ADD COLUMN fgts_amount numeric DEFAULT 0;