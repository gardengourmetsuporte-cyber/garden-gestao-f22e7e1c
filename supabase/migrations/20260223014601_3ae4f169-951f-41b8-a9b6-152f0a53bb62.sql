
-- Auto-assign admin role in user_roles when a user is assigned as owner in user_units
CREATE OR REPLACE FUNCTION public.auto_assign_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When someone becomes an owner of a unit, ensure they have admin role globally
  IF NEW.role = 'owner' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on user_units insert
DROP TRIGGER IF EXISTS trg_auto_assign_owner_role ON public.user_units;
CREATE TRIGGER trg_auto_assign_owner_role
  AFTER INSERT ON public.user_units
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_owner_role();

-- Also allow authenticated users to insert their own user_units (for onboarding)
-- Check if policy already exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_units' AND policyname = 'Users can insert own unit assignment'
  ) THEN
    CREATE POLICY "Users can insert own unit assignment"
    ON public.user_units
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
