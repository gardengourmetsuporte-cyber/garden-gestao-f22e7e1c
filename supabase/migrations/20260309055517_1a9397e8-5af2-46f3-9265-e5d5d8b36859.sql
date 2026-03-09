
-- RPC to grant one-time signup bonus points to a customer
CREATE OR REPLACE FUNCTION public.grant_signup_bonus(p_customer_id uuid, p_unit_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bonus integer;
  v_already boolean;
BEGIN
  -- Get bonus points from store_info JSON
  SELECT COALESCE(((store_info->>'signup_bonus_points')::integer), 0)
  INTO v_bonus
  FROM units WHERE id = p_unit_id;

  IF v_bonus <= 0 THEN
    RETURN 0;
  END IF;

  -- Check if already granted
  SELECT EXISTS (
    SELECT 1 FROM loyalty_events
    WHERE customer_id = p_customer_id AND unit_id = p_unit_id AND type = 'signup_bonus'
  ) INTO v_already;

  IF v_already THEN
    RETURN 0;
  END IF;

  -- Insert loyalty event
  INSERT INTO loyalty_events (customer_id, unit_id, type, points, description)
  VALUES (p_customer_id, p_unit_id, 'signup_bonus', v_bonus, 'Bônus de cadastro');

  -- Update customer loyalty_points
  UPDATE customers
  SET loyalty_points = COALESCE(loyalty_points, 0) + v_bonus,
      updated_at = now()
  WHERE id = p_customer_id;

  RETURN v_bonus;
END;
$$;

-- Create loyalty_events table if not exists
CREATE TABLE IF NOT EXISTS public.loyalty_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'earn',
  points integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.loyalty_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users with unit access to read
CREATE POLICY "Users can read loyalty events for their units"
  ON public.loyalty_events FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Allow the RPC (security definer) to insert — no direct insert policy needed for customers
-- But allow authenticated insert for the grant_signup_bonus RPC context
CREATE POLICY "Service can insert loyalty events"
  ON public.loyalty_events FOR INSERT TO authenticated
  WITH CHECK (true);
