
CREATE TABLE public.sales_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  month date NOT NULL,
  daily_goal numeric DEFAULT 0,
  monthly_goal numeric DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, month)
);

ALTER TABLE sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access_select" ON sales_goals FOR SELECT TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "unit_access_insert" ON sales_goals FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "unit_access_update" ON sales_goals FOR UPDATE TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "unit_access_delete" ON sales_goals FOR DELETE TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));
