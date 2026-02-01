-- Recreate handle_new_user function with explicit input validation and security comments
-- WARNING: This function uses SECURITY DEFINER - any modifications must be carefully reviewed
-- to prevent privilege escalation vulnerabilities.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_full_name text;
BEGIN
  -- SECURITY: Validate and sanitize user-provided metadata to prevent injection attacks
  -- Only extract full_name from metadata, with strict length limits
  validated_full_name := COALESCE(
    LEFT(TRIM(NEW.raw_user_meta_data->>'full_name'), 255),
    LEFT(TRIM(SPLIT_PART(NEW.email, '@', 1)), 255)
  );
  
  -- Ensure the name is not empty after validation
  IF validated_full_name IS NULL OR validated_full_name = '' THEN
    validated_full_name := 'User';
  END IF;
  
  -- Create profile with validated data only
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, validated_full_name);
  
  -- Assign default role (funcionario) - never allow role specification via metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario');
  
  RETURN NEW;
END;
$$;

-- Add comment to document security considerations
COMMENT ON FUNCTION public.handle_new_user() IS 
'SECURITY DEFINER function - handles new user registration by creating profile and assigning default role. 
IMPORTANT: This function bypasses RLS. Any modifications must be carefully reviewed to prevent:
1. Privilege escalation via user-controlled metadata
2. Injection attacks through unvalidated input
3. Unauthorized role assignments
Last security review: 2026-02-01';