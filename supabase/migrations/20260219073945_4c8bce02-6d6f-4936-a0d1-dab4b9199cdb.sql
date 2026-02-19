
-- =============================================
-- AUDIT LOGS TABLE + LOGGING FUNCTION + TRIGGERS
-- =============================================

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_audit_logs_unit_created ON public.audit_logs (unit_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view logs from their units
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- No direct insert/update/delete from clients - only via SECURITY DEFINER function
CREATE POLICY "Block direct writes to audit_logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (false);

-- SECURITY DEFINER function to log events from triggers
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_unit_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, unit_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_unit_id, p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- =============================================
-- TRIGGER: stock_movements INSERT
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item_name text;
BEGIN
  SELECT name INTO item_name FROM public.inventory_items WHERE id = NEW.item_id;
  PERFORM log_audit_event(
    NEW.user_id,
    NEW.unit_id,
    'stock_' || NEW.type,
    'stock_movements',
    NEW.id,
    jsonb_build_object('item_name', COALESCE(item_name, ''), 'quantity', NEW.quantity, 'type', NEW.type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_on_stock_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_stock_movement();

-- =============================================
-- TRIGGER: finance_transactions INSERT/DELETE
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_finance_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      NEW.unit_id,
      'transaction_created',
      'finance_transactions',
      NEW.id,
      jsonb_build_object('description', NEW.description, 'amount', NEW.amount, 'type', NEW.type)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      OLD.user_id,
      OLD.unit_id,
      'transaction_deleted',
      'finance_transactions',
      OLD.id,
      jsonb_build_object('description', OLD.description, 'amount', OLD.amount, 'type', OLD.type)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_on_finance_transaction
  AFTER INSERT OR DELETE ON public.finance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_finance_transaction();

-- =============================================
-- TRIGGER: cash_closings INSERT/UPDATE
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_cash_closing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      NEW.unit_id,
      'cash_closing_created',
      'cash_closings',
      NEW.id,
      jsonb_build_object('date', NEW.date, 'total', COALESCE(NEW.total_amount, 0), 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      NEW.user_id,
      NEW.unit_id,
      'cash_closing_updated',
      'cash_closings',
      NEW.id,
      jsonb_build_object('date', NEW.date, 'total', COALESCE(NEW.total_amount, 0), 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_on_cash_closing
  AFTER INSERT OR UPDATE ON public.cash_closings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_cash_closing();

-- =============================================
-- TRIGGER: checklist_completions INSERT
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_checklist_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item_name text;
BEGIN
  SELECT name INTO item_name FROM public.checklist_items WHERE id = NEW.item_id;
  PERFORM log_audit_event(
    NEW.completed_by,
    NEW.unit_id,
    'checklist_completed',
    'checklist_completions',
    NEW.id,
    jsonb_build_object('item_name', COALESCE(item_name, ''), 'points', NEW.points_awarded, 'type', NEW.checklist_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_on_checklist_completion
  AFTER INSERT ON public.checklist_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_checklist_completion();
