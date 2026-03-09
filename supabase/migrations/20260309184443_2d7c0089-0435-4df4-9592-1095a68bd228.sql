
-- Remove legacy RLS policies on customers that query auth.users directly (causes "permission denied for table users")
DROP POLICY IF EXISTS "Authenticated users can insert customer with their email" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own record by email" ON public.customers;
DROP POLICY IF EXISTS "Customers can view own record by email" ON public.customers;
