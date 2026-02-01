-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated can view suppliers" ON public.suppliers;

-- Create new policies that allow all authenticated users to manage categories
CREATE POLICY "Authenticated can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated can manage categories" 
ON public.categories 
FOR ALL 
USING (is_authenticated())
WITH CHECK (is_authenticated());

-- Create new policies that allow all authenticated users to manage suppliers
CREATE POLICY "Authenticated can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated can manage suppliers" 
ON public.suppliers 
FOR ALL 
USING (is_authenticated())
WITH CHECK (is_authenticated());