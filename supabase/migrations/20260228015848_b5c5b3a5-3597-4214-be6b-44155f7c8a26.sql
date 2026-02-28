
CREATE OR REPLACE FUNCTION public.auto_update_customer_loyalty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_rule RECORD;
BEGIN
  -- Recalculate RFM score
  PERFORM recalculate_customer_score(NEW.id);
  -- Recalculate loyalty_points from active rules
  SELECT * INTO v_rule FROM loyalty_rules
    WHERE unit_id = NEW.unit_id AND rule_type = 'points_per_real' AND is_active = true LIMIT 1;
  IF FOUND THEN
    UPDATE customers SET loyalty_points = floor(NEW.total_spent / GREATEST(v_rule.threshold, 1)) * v_rule.reward_value
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_customer_loyalty ON public.customers;

CREATE TRIGGER trg_customer_loyalty
AFTER UPDATE OF total_spent, total_orders ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.auto_update_customer_loyalty();
