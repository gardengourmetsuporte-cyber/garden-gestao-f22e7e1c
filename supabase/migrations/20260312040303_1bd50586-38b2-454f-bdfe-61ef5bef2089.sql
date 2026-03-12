
CREATE OR REPLACE FUNCTION public.validate_tablet_pin(p_unit_id uuid, p_pin text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees
  WHERE unit_id = p_unit_id
    AND quick_pin = p_pin
    AND is_active = true
    AND deleted_at IS NULL
  LIMIT 1;
$$;
