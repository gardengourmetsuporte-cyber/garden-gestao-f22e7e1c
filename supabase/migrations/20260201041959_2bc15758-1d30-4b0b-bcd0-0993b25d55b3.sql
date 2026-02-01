-- Fix suppliers SELECT policy to require authentication
DROP POLICY IF EXISTS "Authenticated can view suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (is_authenticated());

-- Re-apply profiles SELECT policy to ensure it's correctly configured
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_authenticated());