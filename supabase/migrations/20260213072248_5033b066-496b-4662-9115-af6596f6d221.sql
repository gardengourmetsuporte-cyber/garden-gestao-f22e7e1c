
-- Table already exists: finance_snapshots was repurposed, but dashboard_layouts is new
CREATE TABLE public.dashboard_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_dashboard_layouts_user ON public.dashboard_layouts (user_id);

CREATE POLICY "Users manage own layout"
ON public.dashboard_layouts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_dashboard_layouts_updated_at
BEFORE UPDATE ON public.dashboard_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
