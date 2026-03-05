
-- Table: medical_certificates
CREATE TABLE public.medical_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  date_start date NOT NULL,
  date_end date NOT NULL,
  days_count integer NOT NULL DEFAULT 1,
  document_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;

-- RLS: users can see their own, admins can see all in unit
CREATE POLICY "Users can view own certificates"
  ON public.medical_certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert own certificates"
  ON public.medical_certificates FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can update certificates"
  ON public.medical_certificates FOR UPDATE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Admins can delete certificates"
  ON public.medical_certificates FOR DELETE TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-certificates', 'medical-certificates', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own certificate files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'medical-certificates' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  ));

-- Add certificate_id to time_records
ALTER TABLE public.time_records ADD COLUMN IF NOT EXISTS certificate_id uuid REFERENCES public.medical_certificates(id);
