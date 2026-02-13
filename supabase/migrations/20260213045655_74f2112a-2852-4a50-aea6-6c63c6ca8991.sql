
-- 1. Alter tablet_products with new columns
ALTER TABLE public.tablet_products 
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS is_highlighted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_18_plus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{"tablet":true,"delivery":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule jsonb,
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS custom_prices jsonb;

-- 2. menu_categories
CREATE TABLE public.menu_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT 'UtensilsCrossed',
  color text NOT NULL DEFAULT '#6366f1',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu_categories"
  ON public.menu_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu_categories"
  ON public.menu_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. menu_groups
CREATE TABLE public.menu_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  availability jsonb NOT NULL DEFAULT '{"tablet":true,"delivery":true}'::jsonb,
  schedule jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu_groups"
  ON public.menu_groups FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu_groups"
  ON public.menu_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add FK from tablet_products to menu_groups
ALTER TABLE public.tablet_products
  ADD CONSTRAINT tablet_products_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES public.menu_groups(id) ON DELETE SET NULL;

-- 4. menu_option_groups
CREATE TABLE public.menu_option_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title text NOT NULL,
  min_selections integer NOT NULL DEFAULT 0,
  max_selections integer NOT NULL DEFAULT 1,
  allow_repeat boolean NOT NULL DEFAULT false,
  availability jsonb NOT NULL DEFAULT '{"tablet":true,"delivery":true}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_option_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu_option_groups"
  ON public.menu_option_groups FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu_option_groups"
  ON public.menu_option_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. menu_options
CREATE TABLE public.menu_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group_id uuid NOT NULL REFERENCES public.menu_option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  codigo_pdv text,
  availability jsonb NOT NULL DEFAULT '{"tablet":true,"delivery":true}'::jsonb,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu_options"
  ON public.menu_options FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu_options"
  ON public.menu_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. menu_product_option_groups (N:N link)
CREATE TABLE public.menu_product_option_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.tablet_products(id) ON DELETE CASCADE,
  option_group_id uuid NOT NULL REFERENCES public.menu_option_groups(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(product_id, option_group_id)
);

ALTER TABLE public.menu_product_option_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view menu_product_option_groups"
  ON public.menu_product_option_groups FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu_product_option_groups"
  ON public.menu_product_option_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_option_groups;

-- Indexes
CREATE INDEX idx_menu_groups_category_id ON public.menu_groups(category_id);
CREATE INDEX idx_menu_options_option_group_id ON public.menu_options(option_group_id);
CREATE INDEX idx_menu_product_option_groups_product_id ON public.menu_product_option_groups(product_id);
CREATE INDEX idx_tablet_products_group_id ON public.tablet_products(group_id);
