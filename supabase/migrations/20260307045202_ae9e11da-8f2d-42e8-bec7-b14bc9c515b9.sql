
CREATE TABLE public.system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  backup_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  tables_included text[] NOT NULL DEFAULT '{}',
  total_records integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own unit backups"
ON public.system_backups
FOR ALL
TO authenticated
USING (user_has_unit_access(auth.uid(), unit_id))
WITH CHECK (user_has_unit_access(auth.uid(), unit_id));
