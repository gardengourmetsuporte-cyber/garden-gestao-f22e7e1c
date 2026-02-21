
-- Add unique constraint to prevent duplicate default accounts per user+unit+name+type
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_accounts_unique_per_user_unit_name_type
ON public.finance_accounts (user_id, COALESCE(unit_id, '00000000-0000-0000-0000-000000000000'::uuid), name, type);
