
-- Create recurring_subscriptions table
CREATE TABLE public.recurring_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  type text NOT NULL DEFAULT 'assinatura',
  price numeric NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'mensal',
  next_payment_date date,
  status text NOT NULL DEFAULT 'ativo',
  management_url text,
  notes text,
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view subscriptions in their units"
  ON public.recurring_subscriptions FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert subscriptions in their units"
  ON public.recurring_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update subscriptions in their units"
  ON public.recurring_subscriptions FOR UPDATE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete subscriptions in their units"
  ON public.recurring_subscriptions FOR DELETE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_subscriptions;
