
-- Drop the recursive policy that broke everything
DROP POLICY IF EXISTS "Users can view members of their units" ON public.user_units;

-- Create a security definer function to get user's unit IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_unit_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.user_units WHERE user_id = _user_id;
$$;

-- Now create the policy using the security definer function
CREATE POLICY "Users can view members of their units"
ON public.user_units
FOR SELECT
USING (
  unit_id IN (SELECT public.get_user_unit_ids(auth.uid()))
);
