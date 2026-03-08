
-- Create a security definer function for digital menu customer upsert
-- This bypasses RLS so the menu customer can save their profile data
CREATE OR REPLACE FUNCTION public.upsert_menu_customer(
  p_unit_id uuid,
  p_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_birthday text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id uuid;
  v_auth_email text;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Get auth email for verification
  SELECT email INTO v_auth_email FROM auth.users WHERE id = auth.uid();

  -- Try to find existing customer by email first, then phone
  IF v_auth_email IS NOT NULL AND v_auth_email != '' THEN
    SELECT id INTO v_customer_id FROM customers
    WHERE unit_id = p_unit_id AND email = v_auth_email LIMIT 1;
  END IF;

  IF v_customer_id IS NULL AND p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT id INTO v_customer_id FROM customers
    WHERE unit_id = p_unit_id AND phone = p_phone LIMIT 1;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    -- Update existing
    UPDATE customers SET
      name = p_name,
      phone = COALESCE(p_phone, phone),
      email = COALESCE(v_auth_email, email),
      birthday = COALESCE(p_birthday, birthday),
      updated_at = now()
    WHERE id = v_customer_id;
  ELSE
    -- Insert new
    INSERT INTO customers (unit_id, name, email, phone, birthday, origin, score, segment, loyalty_points, total_spent, total_orders)
    VALUES (p_unit_id, p_name, v_auth_email, p_phone, p_birthday, 'digital_menu', 0, 'new', 0, 0, 0)
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$;
