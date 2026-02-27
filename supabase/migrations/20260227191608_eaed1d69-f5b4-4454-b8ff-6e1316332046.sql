
-- 1. Add CRM columns to customers
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS segment text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visit_frequency_days numeric DEFAULT null;

-- 2. Create loyalty_rules table
CREATE TABLE IF NOT EXISTS public.loyalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  rule_type text NOT NULL, -- 'orders_for_free' | 'points_per_real' | 'birthday_discount'
  threshold numeric NOT NULL DEFAULT 10,
  reward_value numeric NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create loyalty_events table
CREATE TABLE IF NOT EXISTS public.loyalty_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'earn' | 'redeem' | 'birthday_bonus'
  points integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS for loyalty_rules
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty_rules of their units"
  ON public.loyalty_rules FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert loyalty_rules for their units"
  ON public.loyalty_rules FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update loyalty_rules of their units"
  ON public.loyalty_rules FOR UPDATE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete loyalty_rules of their units"
  ON public.loyalty_rules FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- 5. RLS for loyalty_events
ALTER TABLE public.loyalty_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty_events of their units"
  ON public.loyalty_events FOR SELECT
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert loyalty_events for their units"
  ON public.loyalty_events FOR INSERT
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete loyalty_events of their units"
  ON public.loyalty_events FOR DELETE
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- 6. Function to recalculate customer score (RFM model)
CREATE OR REPLACE FUNCTION public.recalculate_customer_score(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_recency_score numeric;
  v_frequency_score numeric;
  v_monetary_score numeric;
  v_total_score integer;
  v_segment text;
  v_days_since_last numeric;
  v_total_orders integer;
  v_total_spent numeric;
  v_last_purchase timestamptz;
BEGIN
  SELECT 
    COALESCE(total_orders, 0),
    COALESCE(total_spent, 0),
    last_purchase_at::timestamptz
  INTO v_total_orders, v_total_spent, v_last_purchase
  FROM customers WHERE id = p_customer_id;

  -- Recency (0-30): days since last purchase
  IF v_last_purchase IS NULL THEN
    v_days_since_last := 999;
    v_recency_score := 0;
  ELSE
    v_days_since_last := EXTRACT(EPOCH FROM (now() - v_last_purchase)) / 86400;
    v_recency_score := GREATEST(0, 30 - (v_days_since_last / 2));
  END IF;

  -- Frequency (0-30): based on total orders
  v_frequency_score := LEAST(30, v_total_orders * 3);

  -- Monetary (0-40): based on total spent (each R$100 = 4 points, max 40)
  v_monetary_score := LEAST(40, (v_total_spent / 100) * 4);

  v_total_score := ROUND(v_recency_score + v_frequency_score + v_monetary_score);

  -- Determine segment
  IF v_total_score >= 70 THEN
    v_segment := 'vip';
  ELSIF v_total_score >= 45 THEN
    v_segment := 'frequent';
  ELSIF v_total_score >= 20 THEN
    v_segment := 'occasional';
  ELSIF v_total_orders = 0 THEN
    v_segment := 'new';
  ELSE
    v_segment := 'inactive';
  END IF;

  UPDATE customers
  SET score = v_total_score,
      segment = v_segment,
      visit_frequency_days = CASE 
        WHEN v_total_orders > 1 AND v_last_purchase IS NOT NULL 
        THEN v_days_since_last / GREATEST(v_total_orders - 1, 1)
        ELSE NULL
      END,
      updated_at = now()
  WHERE id = p_customer_id;
END;
$$;

-- 7. Function to recalculate all customers of a unit
CREATE OR REPLACE FUNCTION public.recalculate_all_customer_scores(p_unit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c_id uuid;
BEGIN
  FOR c_id IN SELECT id FROM customers WHERE unit_id = p_unit_id LOOP
    PERFORM recalculate_customer_score(c_id);
  END LOOP;
END;
$$;
