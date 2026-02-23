
-- Remove the overly permissive "anyone can read" policy and keep only the unit-scoped one
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.invites;

-- Add a function to allow reading invite by token without auth (for invite accept page)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE(
  id uuid,
  email text,
  unit_id uuid,
  role text,
  token uuid,
  accepted_at timestamptz,
  expires_at timestamptz,
  unit_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id, i.email, i.unit_id, i.role, i.token, i.accepted_at, i.expires_at,
    u.name as unit_name
  FROM public.invites i
  JOIN public.units u ON u.id = i.unit_id
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
    AND i.expires_at > now()
  LIMIT 1;
$$;
