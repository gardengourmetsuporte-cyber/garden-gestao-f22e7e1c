
-- Cash register sessions for PDV
CREATE TABLE public.pos_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  initial_cash numeric NOT NULL DEFAULT 0,
  closed_by uuid,
  closed_at timestamptz,
  final_cash numeric,
  cash_difference numeric,
  total_cash numeric DEFAULT 0,
  total_debit numeric DEFAULT 0,
  total_credit numeric DEFAULT 0,
  total_pix numeric DEFAULT 0,
  total_meal_voucher numeric DEFAULT 0,
  total_delivery numeric DEFAULT 0,
  total_signed_account numeric DEFAULT 0,
  total_sales numeric DEFAULT 0,
  sales_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  cash_closing_id uuid REFERENCES public.cash_closings(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cash registers for their units"
  ON public.pos_cash_registers FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert cash registers for their units"
  ON public.pos_cash_registers FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update cash registers for their units"
  ON public.pos_cash_registers FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX idx_pos_cash_registers_unit_status ON public.pos_cash_registers(unit_id, status);
