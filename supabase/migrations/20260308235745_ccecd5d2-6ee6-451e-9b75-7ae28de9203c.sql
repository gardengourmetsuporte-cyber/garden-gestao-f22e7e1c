DROP FUNCTION IF EXISTS public.get_invite_by_token(uuid);

CREATE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE(
  id uuid,
  email text,
  unit_id uuid,
  role text,
  token uuid,
  accepted_at timestamptz,
  expires_at timestamptz,
  unit_name text,
  access_level_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    i.id,
    i.email,
    i.unit_id,
    i.role,
    i.token,
    i.accepted_at,
    i.expires_at,
    u.name as unit_name,
    i.access_level_id
  FROM public.invites i
  JOIN public.units u ON u.id = i.unit_id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > now()
  LIMIT 1;
$$;