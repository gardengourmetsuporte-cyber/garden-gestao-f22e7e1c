
-- Fix 1: Disable the old auto_update_customer_loyalty trigger that conflicts
-- It recalculates loyalty_points from loyalty_rules, overwriting direct coin awards
DROP TRIGGER IF EXISTS auto_update_customer_loyalty ON public.customers;

-- Fix 2: Improve customer matching to use email/phone when available
CREATE OR REPLACE FUNCTION public.auto_register_customer_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id uuid;
  v_customer_name text;
  v_coins_to_award integer;
  v_email text;
  v_phone text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IN ('delivered', 'completed') AND OLD.status NOT IN ('delivered', 'completed') THEN
    v_customer_name := COALESCE(NULLIF(trim(NEW.customer_name), ''), 'Cliente');
    -- Don't award coins for coin-paid orders (total = 0 with coin note)
    IF NEW.notes IS NOT NULL AND NEW.notes LIKE '%[PAGO_COM_MOEDAS%' THEN
      v_coins_to_award := 0;
    ELSE
      v_coins_to_award := GREATEST(floor(NEW.total)::integer, 0);
    END IF;

    -- Try matching by email first (most reliable), then phone, then name
    v_email := NULLIF(trim(COALESCE(NEW.customer_email, '')), '');
    v_phone := NULLIF(trim(COALESCE(NEW.customer_phone, '')), '');

    IF v_email IS NOT NULL THEN
      SELECT id INTO v_customer_id FROM public.customers
      WHERE unit_id = NEW.unit_id AND email = v_email LIMIT 1;
    END IF;

    IF v_customer_id IS NULL AND v_phone IS NOT NULL THEN
      SELECT id INTO v_customer_id FROM public.customers
      WHERE unit_id = NEW.unit_id AND phone = v_phone LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
      SELECT id INTO v_customer_id FROM public.customers
      WHERE unit_id = NEW.unit_id AND lower(trim(name)) = lower(v_customer_name) LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (
        unit_id, name, email, phone, origin, score, segment, loyalty_points,
        total_spent, total_orders, last_purchase_at
      ) VALUES (
        NEW.unit_id, v_customer_name, v_email, v_phone,
        CASE WHEN NEW.source = 'delivery' THEN 'delivery' ELSE 'mesa' END,
        0, 'new', v_coins_to_award,
        NEW.total, 1, now()
      )
      RETURNING id INTO v_customer_id;
    ELSE
      UPDATE public.customers SET
        name = COALESCE(NULLIF(v_customer_name, 'Cliente'), name),
        email = COALESCE(v_email, email),
        phone = COALESCE(v_phone, phone),
        loyalty_points = COALESCE(loyalty_points, 0) + v_coins_to_award,
        total_spent = COALESCE(total_spent, 0) + NEW.total,
        total_orders = COALESCE(total_orders, 0) + 1,
        last_purchase_at = now(),
        updated_at = now()
      WHERE id = v_customer_id;
    END IF;

    IF v_coins_to_award > 0 THEN
      INSERT INTO public.loyalty_events (customer_id, unit_id, type, points, description)
      VALUES (v_customer_id, NEW.unit_id, 'earned', v_coins_to_award,
        'Pedido #' || left(NEW.id::text, 8) || ' - R$' || NEW.total::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix 3: Same improvements for INSERT trigger
CREATE OR REPLACE FUNCTION public.auto_register_customer_on_order_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id uuid;
  v_customer_name text;
  v_coins_to_award integer;
  v_email text;
  v_phone text;
BEGIN
  IF NEW.status IN ('delivered', 'completed') THEN
    v_customer_name := COALESCE(NULLIF(trim(NEW.customer_name), ''), 'Cliente');
    IF NEW.notes IS NOT NULL AND NEW.notes LIKE '%[PAGO_COM_MOEDAS%' THEN
      v_coins_to_award := 0;
    ELSE
      v_coins_to_award := GREATEST(floor(NEW.total)::integer, 0);
    END IF;

    v_email := NULLIF(trim(COALESCE(NEW.customer_email, '')), '');
    v_phone := NULLIF(trim(COALESCE(NEW.customer_phone, '')), '');

    IF v_email IS NOT NULL THEN
      SELECT id INTO v_customer_id FROM public.customers
      WHERE unit_id = NEW.unit_id AND email = v_email LIMIT 1;
    END IF;

    IF v_customer_id IS NULL AND v_phone IS NOT NULL THEN
      SELECT id INTO v_customer_id FROM public.customers
      WHERE unit_id = NEW.unit_id AND phone = v_phone LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
      SELECT id INTO v_customer_id FROM public.customers
      WHERE unit_id = NEW.unit_id AND lower(trim(name)) = lower(v_customer_name) LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (
        unit_id, name, email, phone, origin, score, segment, loyalty_points,
        total_spent, total_orders, last_purchase_at
      ) VALUES (
        NEW.unit_id, v_customer_name, v_email, v_phone,
        CASE WHEN NEW.source = 'delivery' THEN 'delivery' ELSE 'mesa' END,
        0, 'new', v_coins_to_award,
        NEW.total, 1, now()
      )
      RETURNING id INTO v_customer_id;
    ELSE
      UPDATE public.customers SET
        name = COALESCE(NULLIF(v_customer_name, 'Cliente'), name),
        email = COALESCE(v_email, email),
        phone = COALESCE(v_phone, phone),
        loyalty_points = COALESCE(loyalty_points, 0) + v_coins_to_award,
        total_spent = COALESCE(total_spent, 0) + NEW.total,
        total_orders = COALESCE(total_orders, 0) + 1,
        last_purchase_at = now(),
        updated_at = now()
      WHERE id = v_customer_id;
    END IF;

    IF v_coins_to_award > 0 THEN
      INSERT INTO public.loyalty_events (customer_id, unit_id, type, points, description)
      VALUES (v_customer_id, NEW.unit_id, 'earned', v_coins_to_award,
        'Pedido #' || left(NEW.id::text, 8) || ' - R$' || NEW.total::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix 4: Add customer_email column to tablet_orders if missing (for better matching)
ALTER TABLE public.tablet_orders ADD COLUMN IF NOT EXISTS customer_email text DEFAULT NULL;
