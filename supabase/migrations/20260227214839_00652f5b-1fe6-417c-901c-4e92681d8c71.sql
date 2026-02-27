
-- Add requires_photo to checklist_items
ALTER TABLE public.checklist_items ADD COLUMN IF NOT EXISTS requires_photo boolean NOT NULL DEFAULT false;

-- Add photo_url to checklist_completions
ALTER TABLE public.checklist_completions ADD COLUMN IF NOT EXISTS photo_url text;

-- Create checklist-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('checklist-photos', 'checklist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload
CREATE POLICY "Authenticated users can upload checklist photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'checklist-photos');

-- RLS: anyone can read (public bucket)
CREATE POLICY "Anyone can read checklist photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'checklist-photos');

-- RLS: authenticated users can delete own uploads
CREATE POLICY "Authenticated users can delete own checklist photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'checklist-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
