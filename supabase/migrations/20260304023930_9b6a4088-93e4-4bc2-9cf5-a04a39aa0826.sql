
-- Fix bonus_points RLS: allow authenticated users to view all bonus points (needed for profiles/leaderboard)
DROP POLICY IF EXISTS "Users can view own bonus_points" ON public.bonus_points;
CREATE POLICY "Authenticated can view bonus_points"
ON public.bonus_points
FOR SELECT
TO authenticated
USING (true);

-- Fix reward_redemptions RLS: allow authenticated users to view all redemptions (needed for profiles)
DROP POLICY IF EXISTS "Users can view own redemptions or admin all" ON public.reward_redemptions;
CREATE POLICY "Authenticated can view redemptions"
ON public.reward_redemptions
FOR SELECT
TO authenticated
USING (true);

-- Fix employees RLS: allow authenticated users to view employee records (needed for profiles)
DROP POLICY IF EXISTS "Users can view own employee record" ON public.employees;
CREATE POLICY "Authenticated can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (true);
