
-- Allow authenticated users (with agenda module access via app-level check) to manage their own tasks
-- Drop restrictive admin-only policies on manager_tasks
DROP POLICY IF EXISTS "Admins can view own tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Admins can insert own tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Admins can update own tasks" ON public.manager_tasks;
DROP POLICY IF EXISTS "Admins can delete own tasks" ON public.manager_tasks;

-- Create user-scoped policies (app-level checks module access)
CREATE POLICY "Users can view own tasks"
  ON public.manager_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.manager_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.manager_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.manager_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Same for manager_appointments
DROP POLICY IF EXISTS "Admins can view own appointments" ON public.manager_appointments;
DROP POLICY IF EXISTS "Admins can insert own appointments" ON public.manager_appointments;
DROP POLICY IF EXISTS "Admins can update own appointments" ON public.manager_appointments;
DROP POLICY IF EXISTS "Admins can delete own appointments" ON public.manager_appointments;

CREATE POLICY "Users can view own appointments"
  ON public.manager_appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON public.manager_appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON public.manager_appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON public.manager_appointments FOR DELETE
  USING (auth.uid() = user_id);

-- Same for task_categories
DROP POLICY IF EXISTS "Users can manage own categories" ON public.task_categories;

CREATE POLICY "Users can view own task categories"
  ON public.task_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task categories"
  ON public.task_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task categories"
  ON public.task_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own task categories"
  ON public.task_categories FOR DELETE
  USING (auth.uid() = user_id);
