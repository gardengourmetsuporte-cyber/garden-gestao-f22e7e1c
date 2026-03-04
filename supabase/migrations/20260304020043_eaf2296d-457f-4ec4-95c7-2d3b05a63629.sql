
-- 1. Add quick_pin column to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS quick_pin text;

-- 2. Timer settings per checklist type per unit
CREATE TABLE public.checklist_timer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  checklist_type text NOT NULL, -- 'abertura', 'fechamento', 'bonus'
  is_enabled boolean NOT NULL DEFAULT false,
  min_executions_for_stats integer NOT NULL DEFAULT 3,
  bonus_points_avg integer NOT NULL DEFAULT 2,
  bonus_points_record integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  UNIQUE(unit_id, checklist_type)
);

ALTER TABLE public.checklist_timer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timer settings for their units"
ON public.checklist_timer_settings FOR SELECT TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can manage timer settings for their units"
ON public.checklist_timer_settings FOR ALL TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id))
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

-- 3. Task time records (history of timed executions)
CREATE TABLE public.checklist_task_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  checklist_type text NOT NULL,
  date text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  duration_seconds integer,
  bonus_awarded integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_task_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task times for their units"
ON public.checklist_task_times FOR SELECT TO authenticated
USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert task times for their units"
ON public.checklist_task_times FOR INSERT TO authenticated
WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update their own task times"
ON public.checklist_task_times FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX idx_checklist_task_times_item ON public.checklist_task_times(item_id);
CREATE INDEX idx_checklist_task_times_unit_date ON public.checklist_task_times(unit_id, date);
CREATE INDEX idx_checklist_task_times_stats ON public.checklist_task_times(item_id, duration_seconds) WHERE duration_seconds IS NOT NULL;

-- 4. Function to get computed stats (avg + record) per item
CREATE OR REPLACE FUNCTION public.get_checklist_time_stats(p_item_ids uuid[])
RETURNS TABLE(
  item_id uuid,
  execution_count bigint,
  avg_seconds numeric,
  record_seconds integer,
  record_holder uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    ct.item_id,
    COUNT(*) AS execution_count,
    ROUND(AVG(ct.duration_seconds)) AS avg_seconds,
    MIN(ct.duration_seconds) AS record_seconds,
    (SELECT ct2.user_id FROM checklist_task_times ct2
     WHERE ct2.item_id = ct.item_id AND ct2.duration_seconds IS NOT NULL
     ORDER BY ct2.duration_seconds ASC LIMIT 1) AS record_holder
  FROM checklist_task_times ct
  WHERE ct.item_id = ANY(p_item_ids)
    AND ct.duration_seconds IS NOT NULL
  GROUP BY ct.item_id;
$$;
