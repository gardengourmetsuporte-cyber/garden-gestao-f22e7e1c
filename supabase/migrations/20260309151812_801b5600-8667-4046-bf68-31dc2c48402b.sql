
-- Table: legal_obligations
CREATE TABLE public.legal_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  description text,
  document_url text,
  issue_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'active',
  alert_days_before integer NOT NULL DEFAULT 30,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.legal_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view obligations of their units"
  ON public.legal_obligations FOR SELECT TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert obligations to their units"
  ON public.legal_obligations FOR INSERT TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update obligations of their units"
  ON public.legal_obligations FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete obligations of their units"
  ON public.legal_obligations FOR DELETE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-documents', 'legal-documents', false);

CREATE POLICY "Users can upload legal documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'legal-documents');

CREATE POLICY "Users can view legal documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'legal-documents');

CREATE POLICY "Users can delete legal documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'legal-documents');
