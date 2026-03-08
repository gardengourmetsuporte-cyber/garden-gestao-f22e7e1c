
-- Add recipe linkage and profit margin to tablet_products
ALTER TABLE public.tablet_products 
  ADD COLUMN IF NOT EXISTS recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profit_margin numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_per_portion numeric DEFAULT 0;

-- Index for fast recipe lookups
CREATE INDEX IF NOT EXISTS idx_tablet_products_recipe_id ON public.tablet_products(recipe_id);
