
CREATE TABLE public.customer_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  segment text,
  message text NOT NULL,
  total_recipients integer NOT NULL DEFAULT 0,
  total_sent integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns of their units"
  ON public.customer_campaigns FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can create campaigns for their units"
  ON public.customer_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update campaigns of their units"
  ON public.customer_campaigns FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));
