
-- 1. Add coin_price to tablet_products (null = not available for coins)
ALTER TABLE public.tablet_products ADD COLUMN IF NOT EXISTS coin_price integer DEFAULT NULL;

-- 2. Create function to auto-register customer and award coins on order status change
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
BEGIN
  -- Only trigger on status change to 'delivered' or 'completed' (final states)
  IF TG_OP = 'UPDATE' AND NEW.status IN ('delivered', 'completed') AND OLD.status NOT IN ('delivered', 'completed') THEN
    v_customer_name := COALESCE(NULLIF(NEW.customer_name, ''), 'Cliente');
    v_coins_to_award := GREATEST(floor(NEW.total)::integer, 0);

    -- Try to find existing customer by name in this unit
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE unit_id = NEW.unit_id
      AND lower(trim(name)) = lower(trim(v_customer_name))
    LIMIT 1;

    IF v_customer_id IS NULL THEN
      -- Create new customer
      INSERT INTO public.customers (
        unit_id, name, origin, score, segment, loyalty_points,
        total_spent, total_orders, last_purchase_at
      ) VALUES (
        NEW.unit_id, v_customer_name, 
        CASE WHEN NEW.source = 'delivery' THEN 'delivery' ELSE 'digital_menu' END,
        0, 'new', v_coins_to_award,
        NEW.total, 1, now()
      )
      RETURNING id INTO v_customer_id;
    ELSE
      -- Update existing customer
      UPDATE public.customers SET
        loyalty_points = COALESCE(loyalty_points, 0) + v_coins_to_award,
        total_spent = COALESCE(total_spent, 0) + NEW.total,
        total_orders = COALESCE(total_orders, 0) + 1,
        last_purchase_at = now(),
        updated_at = now()
      WHERE id = v_customer_id;
    END IF;

    -- Log loyalty event
    IF v_coins_to_award > 0 THEN
      INSERT INTO public.loyalty_events (customer_id, unit_id, type, points, description)
      VALUES (v_customer_id, NEW.unit_id, 'earned', v_coins_to_award,
        'Pedido #' || left(NEW.id::text, 8) || ' - R$' || NEW.total::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to tablet_orders
DROP TRIGGER IF EXISTS trg_auto_register_customer ON public.tablet_orders;
CREATE TRIGGER trg_auto_register_customer
  AFTER UPDATE ON public.tablet_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_customer_on_order();

-- 4. Also handle INSERT with already-final status (e.g. auto-confirmed)
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
BEGIN
  IF NEW.status IN ('delivered', 'completed') THEN
    v_customer_name := COALESCE(NULLIF(NEW.customer_name, ''), 'Cliente');
    v_coins_to_award := GREATEST(floor(NEW.total)::integer, 0);

    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE unit_id = NEW.unit_id
      AND lower(trim(name)) = lower(trim(v_customer_name))
    LIMIT 1;

    IF v_customer_id IS NULL THEN
      INSERT INTO public.customers (
        unit_id, name, origin, score, segment, loyalty_points,
        total_spent, total_orders, last_purchase_at
      ) VALUES (
        NEW.unit_id, v_customer_name,
        CASE WHEN NEW.source = 'delivery' THEN 'delivery' ELSE 'digital_menu' END,
        0, 'new', v_coins_to_award,
        NEW.total, 1, now()
      )
      RETURNING id INTO v_customer_id;
    ELSE
      UPDATE public.customers SET
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

DROP TRIGGER IF EXISTS trg_auto_register_customer_insert ON public.tablet_orders;
CREATE TRIGGER trg_auto_register_customer_insert
  AFTER INSERT ON public.tablet_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_customer_on_order_insert();
