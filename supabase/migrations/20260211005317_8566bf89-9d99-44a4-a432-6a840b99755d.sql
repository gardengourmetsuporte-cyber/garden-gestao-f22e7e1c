
-- =============================================
-- FASE 1b: Multi-tenant - Estrutura completa
-- =============================================

-- 1. Criar tabela de unidades
CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage units"
  ON public.units FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated can view active units"
  ON public.units FOR SELECT
  USING (is_active = true AND is_authenticated());

-- 2. Tabela de associação usuário <-> unidade
CREATE TABLE public.user_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, unit_id)
);

ALTER TABLE public.user_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage user_units"
  ON public.user_units FOR ALL
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own unit assignments"
  ON public.user_units FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Adicionar unit_id às tabelas operacionais (nullable para migração)
ALTER TABLE public.inventory_items ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.stock_movements ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.categories ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.suppliers ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.finance_accounts ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.finance_transactions ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.finance_categories ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.finance_budgets ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.finance_tags ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.credit_card_invoices ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.cash_closings ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.checklist_sectors ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.checklist_subcategories ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.checklist_items ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.checklist_completions ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.employees ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.employee_payments ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.orders ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.order_items ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.supplier_invoices ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.notifications ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.work_schedules ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.manager_tasks ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.manager_appointments ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.reward_products ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.reward_redemptions ADD COLUMN unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.payment_method_settings ADD COLUMN unit_id uuid REFERENCES public.units(id);

-- 4. Função helper para verificar acesso à unidade
CREATE OR REPLACE FUNCTION public.user_has_unit_access(_user_id uuid, _unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_units
    WHERE user_id = _user_id AND unit_id = _unit_id
  ) OR has_role(_user_id, 'super_admin')
$$;

-- 5. Atualizar has_role para super_admin herdar admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (role = 'super_admin' AND _role = 'admin'))
  )
$$;

-- 6. Índices para performance
CREATE INDEX idx_inventory_items_unit ON public.inventory_items(unit_id);
CREATE INDEX idx_stock_movements_unit ON public.stock_movements(unit_id);
CREATE INDEX idx_finance_transactions_unit ON public.finance_transactions(unit_id);
CREATE INDEX idx_finance_accounts_unit ON public.finance_accounts(unit_id);
CREATE INDEX idx_cash_closings_unit ON public.cash_closings(unit_id);
CREATE INDEX idx_checklist_completions_unit ON public.checklist_completions(unit_id);
CREATE INDEX idx_employees_unit ON public.employees(unit_id);
CREATE INDEX idx_orders_unit ON public.orders(unit_id);
CREATE INDEX idx_user_units_user ON public.user_units(user_id);
CREATE INDEX idx_user_units_unit ON public.user_units(unit_id);

-- 7. Trigger updated_at para units
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
