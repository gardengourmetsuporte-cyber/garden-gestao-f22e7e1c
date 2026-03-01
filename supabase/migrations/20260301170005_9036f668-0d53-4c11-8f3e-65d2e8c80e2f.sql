
-- Add soft-delete column to regulatory tables
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.finance_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Indexes for performance (filter non-deleted rows)
CREATE INDEX IF NOT EXISTS idx_inventory_items_not_deleted ON public.inventory_items (unit_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_not_deleted ON public.employees (unit_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_not_deleted ON public.customers (unit_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_finance_transactions_not_deleted ON public.finance_transactions (unit_id) WHERE deleted_at IS NULL;
