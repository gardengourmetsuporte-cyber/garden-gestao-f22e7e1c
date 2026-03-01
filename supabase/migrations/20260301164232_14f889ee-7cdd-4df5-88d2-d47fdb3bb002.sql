
-- 1. Add old_values column to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values jsonb DEFAULT NULL;

-- 2. Update log_audit_event to accept old_values
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_unit_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_old_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, unit_id, action, entity_type, entity_id, details, old_values)
  VALUES (p_user_id, p_unit_id, p_action, p_entity_type, p_entity_id, p_details, p_old_values);
END;
$$;

-- 3. Trigger for user_units (role/access changes)
CREATE OR REPLACE FUNCTION public.audit_user_units_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id, NEW.unit_id,
      'user_unit_added', 'user_units', NEW.id::uuid,
      jsonb_build_object('role', NEW.role, 'user_id', NEW.user_id)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      NEW.user_id, NEW.unit_id,
      'user_unit_updated', 'user_units', NEW.id::uuid,
      jsonb_build_object('role', NEW.role, 'user_id', NEW.user_id),
      jsonb_build_object('role', OLD.role)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.user_id, OLD.unit_id,
      'user_unit_removed', 'user_units', OLD.id::uuid,
      jsonb_build_object('role', OLD.role, 'user_id', OLD.user_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_user_units ON public.user_units;
CREATE TRIGGER trg_audit_user_units
  AFTER INSERT OR UPDATE OR DELETE ON public.user_units
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_units_changes();

-- 4. Trigger for access_levels
CREATE OR REPLACE FUNCTION public.audit_access_levels_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      auth.uid(), NEW.unit_id,
      'access_level_updated', 'access_levels', NEW.id,
      jsonb_build_object('name', NEW.name, 'modules', to_jsonb(NEW.modules)),
      jsonb_build_object('name', OLD.name, 'modules', to_jsonb(OLD.modules))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      auth.uid(), OLD.unit_id,
      'access_level_deleted', 'access_levels', OLD.id,
      jsonb_build_object('name', OLD.name)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_access_levels ON public.access_levels;
CREATE TRIGGER trg_audit_access_levels
  AFTER UPDATE OR DELETE ON public.access_levels
  FOR EACH ROW EXECUTE FUNCTION public.audit_access_levels_changes();

-- 5. Trigger for employees
CREATE OR REPLACE FUNCTION public.audit_employees_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      COALESCE(auth.uid(), NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.unit_id,
      'employee_created', 'employees', NEW.id,
      jsonb_build_object('full_name', NEW.full_name, 'role', NEW.role)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      COALESCE(auth.uid(), NEW.user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      NEW.unit_id,
      'employee_updated', 'employees', NEW.id,
      jsonb_build_object('full_name', NEW.full_name, 'role', NEW.role, 'is_active', NEW.is_active, 'base_salary', NEW.base_salary),
      jsonb_build_object('full_name', OLD.full_name, 'role', OLD.role, 'is_active', OLD.is_active, 'base_salary', OLD.base_salary)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      COALESCE(auth.uid(), OLD.user_id, '00000000-0000-0000-0000-000000000000'::uuid),
      OLD.unit_id,
      'employee_deleted', 'employees', OLD.id,
      jsonb_build_object('full_name', OLD.full_name)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_employees ON public.employees;
CREATE TRIGGER trg_audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_employees_changes();

-- 6. Trigger for customers (DELETE only)
CREATE OR REPLACE FUNCTION public.audit_customers_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM log_audit_event(
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    OLD.unit_id,
    'customer_deleted', 'customers', OLD.id,
    jsonb_build_object('name', OLD.name, 'phone', OLD.phone)
  );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_customers_delete ON public.customers;
CREATE TRIGGER trg_audit_customers_delete
  AFTER DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.audit_customers_delete();

-- 7. Trigger for finance_accounts
CREATE OR REPLACE FUNCTION public.audit_finance_accounts_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id, NEW.unit_id,
      'finance_account_created', 'finance_accounts', NEW.id,
      jsonb_build_object('name', NEW.name, 'type', NEW.type, 'balance', NEW.balance)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log meaningful changes (not balance updates from triggers)
    IF OLD.name IS DISTINCT FROM NEW.name OR OLD.type IS DISTINCT FROM NEW.type OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      PERFORM log_audit_event(
        NEW.user_id, NEW.unit_id,
        'finance_account_updated', 'finance_accounts', NEW.id,
        jsonb_build_object('name', NEW.name, 'type', NEW.type, 'is_active', NEW.is_active),
        jsonb_build_object('name', OLD.name, 'type', OLD.type, 'is_active', OLD.is_active)
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.user_id, OLD.unit_id,
      'finance_account_deleted', 'finance_accounts', OLD.id,
      jsonb_build_object('name', OLD.name, 'type', OLD.type)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_finance_accounts ON public.finance_accounts;
CREATE TRIGGER trg_audit_finance_accounts
  AFTER INSERT OR UPDATE OR DELETE ON public.finance_accounts
  FOR EACH ROW EXECUTE FUNCTION public.audit_finance_accounts_changes();

-- 8. Performance index for audit_logs queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
