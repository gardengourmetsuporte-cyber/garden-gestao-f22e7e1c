CREATE OR REPLACE FUNCTION public.validate_tablet_pin(p_unit_id uuid, p_pin text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.employees
  WHERE unit_id = p_unit_id
    AND is_active = true
    AND deleted_at IS NULL
    AND regexp_replace(COALESCE(quick_pin, ''), '\\D', '', 'g') = regexp_replace(COALESCE(p_pin, ''), '\\D', '', 'g')
    AND length(regexp_replace(COALESCE(p_pin, ''), '\\D', '', 'g')) >= 4
  LIMIT 1;
$$;