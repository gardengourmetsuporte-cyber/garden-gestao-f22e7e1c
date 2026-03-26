
-- Add trial_ends_at column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;

-- Update handle_new_user to set trial for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  validated_full_name text;
BEGIN
  validated_full_name := COALESCE(
    LEFT(TRIM(NEW.raw_user_meta_data->>'full_name'), 255),
    LEFT(TRIM(SPLIT_PART(NEW.email, '@', 1)), 255)
  );
  
  IF validated_full_name IS NULL OR validated_full_name = '' THEN
    validated_full_name := 'User';
  END IF;
  
  INSERT INTO public.profiles (user_id, full_name, plan, plan_status, trial_ends_at)
  VALUES (NEW.id, validated_full_name, 'business', 'trialing', now() + interval '14 days');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario');
  
  RETURN NEW;
END;
$function$;
