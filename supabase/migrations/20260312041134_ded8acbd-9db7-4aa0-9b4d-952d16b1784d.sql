CREATE OR REPLACE FUNCTION public.validate_tablet_pin(p_unit_id uuid, p_pin text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH normalized AS (
    SELECT regexp_replace(COALESCE(p_pin, ''), '[^0-9]', '', 'g') AS input_pin
  )
  SELECT e.id
  FROM public.employees e
  CROSS JOIN normalized n
  WHERE e.is_active = true
    AND e.deleted_at IS NULL
    AND regexp_replace(COALESCE(e.quick_pin, ''), '[^0-9]', '', 'g') = n.input_pin
    AND length(n.input_pin) >= 4
    AND (
      e.unit_id = p_unit_id
      OR (
        e.user_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.user_units uu
          WHERE uu.user_id = e.user_id
            AND uu.unit_id = p_unit_id
        )
      )
    )
  ORDER BY CASE WHEN e.unit_id = p_unit_id THEN 0 ELSE 1 END
  LIMIT 1;
$function$;