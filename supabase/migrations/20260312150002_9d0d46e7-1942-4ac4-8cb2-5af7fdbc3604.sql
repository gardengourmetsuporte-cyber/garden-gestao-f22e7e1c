
-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('employee-documents', 'employee-documents', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload employee documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'employee-documents');

CREATE POLICY "Authenticated users can view employee documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'employee-documents');

CREATE POLICY "Authenticated users can delete employee documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'employee-documents');

-- Enable realtime for waitlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
