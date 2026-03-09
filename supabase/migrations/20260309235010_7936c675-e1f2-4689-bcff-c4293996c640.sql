ALTER TABLE public.recipe_cost_settings 
ADD COLUMN IF NOT EXISTS monthly_revenue numeric NOT NULL DEFAULT 50000;