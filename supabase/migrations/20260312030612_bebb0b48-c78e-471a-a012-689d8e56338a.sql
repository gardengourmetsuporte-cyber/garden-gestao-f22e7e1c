
-- Customer reviews table
CREATE TABLE public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT '',
  mesa TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  category TEXT DEFAULT 'geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can insert reviews (tablet is public)
CREATE POLICY "Anyone can insert reviews"
  ON public.customer_reviews FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read reviews for their unit
CREATE POLICY "Authenticated users can read reviews"
  ON public.customer_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Public can insert (anon)
CREATE POLICY "Anon can insert reviews"
  ON public.customer_reviews FOR INSERT
  TO anon
  WITH CHECK (true);

-- Mural posts table  
CREATE TABLE public.mural_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mural_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read active mural posts
CREATE POLICY "Anyone can read mural posts"
  ON public.mural_posts FOR SELECT
  USING (is_active = true);

-- Authenticated can manage mural posts
CREATE POLICY "Authenticated can manage mural posts"
  ON public.mural_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
