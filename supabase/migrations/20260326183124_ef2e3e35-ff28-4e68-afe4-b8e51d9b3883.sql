
-- Table for company documents
CREATE TABLE public.company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT 'other',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- RLS: users can manage documents of their units
CREATE POLICY "Users can view company documents of their units"
  ON public.company_documents FOR SELECT TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "Users can insert company documents"
  ON public.company_documents FOR INSERT TO authenticated
  WITH CHECK (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "Users can update company documents"
  ON public.company_documents FOR UPDATE TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

CREATE POLICY "Users can delete company documents"
  ON public.company_documents FOR DELETE TO authenticated
  USING (unit_id IN (SELECT get_user_unit_ids(auth.uid())));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', true);

-- Storage RLS
CREATE POLICY "Authenticated users can upload company docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-documents');

CREATE POLICY "Anyone can view company docs"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can delete company docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-documents');
