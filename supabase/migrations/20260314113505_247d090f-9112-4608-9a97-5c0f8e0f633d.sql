CREATE OR REPLACE FUNCTION public.get_unit_plan(p_unit_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Primary: owner's plan
    (
      SELECT p.plan
      FROM units u
      JOIN profiles p ON p.user_id = u.created_by
      WHERE u.id = p_unit_id
        AND p.plan IS NOT NULL
        AND p.plan != 'free'
    ),
    -- Fallback: highest plan among all unit members
    (
      SELECT 
        CASE 
          WHEN bool_or(p.plan = 'business') THEN 'business'
          WHEN bool_or(p.plan = 'pro') THEN 'pro'
          ELSE 'free'
        END
      FROM user_units uu
      JOIN profiles p ON p.user_id = uu.user_id
      WHERE uu.unit_id = p_unit_id
        AND (p.plan_status IS NULL OR p.plan_status = 'active')
    ),
    'free'
  );
$$;