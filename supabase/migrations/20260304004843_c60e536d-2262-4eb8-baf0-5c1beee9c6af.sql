
-- =============================================
-- Brand Core: Enums
-- =============================================
CREATE TYPE public.brand_asset_type AS ENUM ('logo', 'product_photo', 'environment', 'menu', 'manual', 'reference');
CREATE TYPE public.brand_reference_type AS ENUM ('strategy', 'campaign_history', 'visual_reference');

-- =============================================
-- 1. brand_identity (1 per unit)
-- =============================================
CREATE TABLE public.brand_identity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  colors JSONB NOT NULL DEFAULT '{"primary":"#22c55e","secondary":"#0a1a10","accent":"#f59e0b","background":"#ffffff"}'::jsonb,
  typography JSONB NOT NULL DEFAULT '{"headings":"Inter","body":"Inter"}'::jsonb,
  tone_of_voice TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  institutional_phrases TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id)
);

ALTER TABLE public.brand_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unit brand identity"
  ON public.brand_identity FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert their unit brand identity"
  ON public.brand_identity FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update their unit brand identity"
  ON public.brand_identity FOR UPDATE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete their unit brand identity"
  ON public.brand_identity FOR DELETE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

-- =============================================
-- 2. brand_assets
-- =============================================
CREATE TABLE public.brand_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type public.brand_asset_type NOT NULL DEFAULT 'reference',
  file_url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unit brand assets"
  ON public.brand_assets FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert their unit brand assets"
  ON public.brand_assets FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update their unit brand assets"
  ON public.brand_assets FOR UPDATE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete their unit brand assets"
  ON public.brand_assets FOR DELETE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX idx_brand_assets_unit ON public.brand_assets(unit_id);
CREATE INDEX idx_brand_assets_type ON public.brand_assets(type);

-- =============================================
-- 3. brand_references
-- =============================================
CREATE TABLE public.brand_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  type public.brand_reference_type NOT NULL DEFAULT 'strategy',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unit brand references"
  ON public.brand_references FOR SELECT
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can insert their unit brand references"
  ON public.brand_references FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can update their unit brand references"
  ON public.brand_references FOR UPDATE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Users can delete their unit brand references"
  ON public.brand_references FOR DELETE
  TO authenticated
  USING (public.user_has_unit_access(auth.uid(), unit_id));

CREATE INDEX idx_brand_references_unit ON public.brand_references(unit_id);

-- =============================================
-- 4. Storage bucket for brand assets
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

CREATE POLICY "Authenticated users can upload brand assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can view brand assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated users can update brand assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated users can delete brand assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-assets');
