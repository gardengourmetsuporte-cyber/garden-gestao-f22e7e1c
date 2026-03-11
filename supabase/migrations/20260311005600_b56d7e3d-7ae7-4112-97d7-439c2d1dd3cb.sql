
-- Table to flag accounts for monitoring (super_admin only)
CREATE TABLE public.monitored_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  notify_on_login boolean NOT NULL DEFAULT true,
  notify_on_actions boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  UNIQUE(user_id, unit_id)
);

ALTER TABLE public.monitored_accounts ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage monitored accounts
CREATE POLICY "Super admins can manage monitored accounts"
ON public.monitored_accounts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Function to notify super_admins when a monitored user logs in
CREATE OR REPLACE FUNCTION public.notify_monitored_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_monitor RECORD;
  v_admin RECORD;
  v_user_name text;
  v_unit_name text;
BEGIN
  -- Only trigger for user_login actions
  IF NEW.action != 'user_login' THEN
    RETURN NEW;
  END IF;

  -- Check if this user is monitored
  FOR v_monitor IN 
    SELECT ma.*, u.name as unit_name
    FROM monitored_accounts ma
    LEFT JOIN units u ON u.id = ma.unit_id
    WHERE ma.user_id = NEW.user_id AND ma.notify_on_login = true
  LOOP
    -- Get user name
    SELECT full_name INTO v_user_name FROM profiles WHERE user_id = NEW.user_id;
    v_user_name := COALESCE(v_user_name, 'Usuário');
    v_unit_name := COALESCE(v_monitor.unit_name, '');

    -- Notify all super_admins
    FOR v_admin IN SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'super_admin' LOOP
      INSERT INTO notifications (user_id, type, title, description, origin)
      VALUES (
        v_admin.user_id,
        'info',
        '👁️ Login monitorado',
        v_user_name || CASE WHEN v_unit_name != '' THEN ' (' || v_unit_name || ')' ELSE '' END || ' acabou de fazer login.',
        'monitor'
      );
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger on audit_logs for monitored login notifications
CREATE TRIGGER trigger_notify_monitored_login
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_monitored_login();
