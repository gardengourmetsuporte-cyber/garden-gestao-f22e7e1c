
-- Create marketing_posts table
CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id),
  user_id uuid NOT NULL,
  title text NOT NULL,
  caption text DEFAULT '',
  media_urls text[] DEFAULT '{}',
  channels text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  tags text[] DEFAULT '{}',
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage marketing_posts"
ON public.marketing_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_marketing_posts_updated_at
BEFORE UPDATE ON public.marketing_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for marketing media
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-media', 'marketing-media', true);

-- Storage policies
CREATE POLICY "Public can view marketing media"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-media');

CREATE POLICY "Admins can upload marketing media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketing-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update marketing media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'marketing-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete marketing media"
ON storage.objects FOR DELETE
USING (bucket_id = 'marketing-media' AND has_role(auth.uid(), 'admin'::app_role));
