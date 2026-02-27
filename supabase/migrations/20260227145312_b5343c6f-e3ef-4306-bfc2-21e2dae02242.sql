
CREATE OR REPLACE FUNCTION public.get_unit_plan(p_unit_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.plan, 'free')
  FROM units u
  JOIN profiles p ON p.user_id = u.created_by
  WHERE u.id = p_unit_id
$$;
