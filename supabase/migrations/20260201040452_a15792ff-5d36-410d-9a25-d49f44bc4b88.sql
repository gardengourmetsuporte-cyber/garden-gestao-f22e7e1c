-- Fix profiles SELECT policy to require authentication
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_authenticated());