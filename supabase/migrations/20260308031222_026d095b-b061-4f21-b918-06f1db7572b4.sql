-- Allow customers to view their own record by email (for digital menu account page)
CREATE POLICY "Customers can view own record by email"
ON public.customers FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow customers to update their own record by email
CREATE POLICY "Customers can update own record by email"
ON public.customers FOR UPDATE TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow inserting customer records for authenticated users (digital menu signup)
CREATE POLICY "Authenticated users can insert customer with their email"
ON public.customers FOR INSERT TO authenticated
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));