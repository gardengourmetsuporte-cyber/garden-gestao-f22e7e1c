
-- Fix qr_login_sessions UPDATE policy (use auth_user_id column)
DROP POLICY IF EXISTS "Authenticated can update qr sessions" ON public.qr_login_sessions;
CREATE POLICY "Authenticated can update qr sessions"
ON public.qr_login_sessions FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR public.user_has_unit_access(auth.uid(), unit_id)));

-- Performance indexes on high-volume tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_unit_created ON public.audit_logs (unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_unit_date ON public.checklist_completions (unit_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_unit_date ON public.finance_transactions (unit_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_unit_created ON public.stock_movements (unit_id, created_at DESC);
